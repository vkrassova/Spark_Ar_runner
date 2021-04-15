const Scene = require('Scene')
const Reactive = require('Reactive')
const FaceTracking = require('FaceTracking')
const FaceGestures = require('FaceGestures')
const TouchGestures = require('TouchGestures')
const Instruction = require('Instruction')
const Animation = require('Animation')
const Textures = require('Textures')
const CameraInfo = require('CameraInfo')
const Materials = require('Materials')
const Diagnostics = require('Diagnostics')

const face = FaceTracking.face(0)

Instruction.bind(true, 'tap_to_start')

const screenScale = CameraInfo.previewScreenScale
const screenW = CameraInfo.previewSize.x.div(screenScale)
const screenH = CameraInfo.previewSize.y.div(screenScale);

(async function () {
  const gameCanvas = await Scene.root.findFirst('game')
  const pers = await Scene.root.findFirst('pers')
  const tank = await Scene.root.findFirst('tank')
  const frontSecond = await Scene.root.findFirst('front_2')
  const frontFirst = await Scene.root.findFirst('front_1')
  const back = await Scene.root.findFirst('sity_back')
  const backImage = [frontFirst, frontSecond, back]
  const user = await Scene.root.findFirst('user')
  // const endGame = await Scene.root.findFirst('end')

  const startPoint = 0
  const startFrontSecond = screenW.mul(6.3)
  const leftFrontFirst = screenW.mul(6.3).neg()
  const leftBack = screenW.mul(5.3).neg()

  const runSeq = await Textures.findFirst('run_seq')
  const jumpSeq = await Textures.findFirst('jump_seq')
  const collider = await Textures.findFirst('die')
  const widthImageUser = screenW.mul(0.48)

  const [material] = await Promise.all([
    Materials.findFirst('pers-mat')
  ])

  // endGame.hidden = true

  material.diffuse = runSeq

  // параметры персонажа и препятствия
  const persWidth = screenW.mul(0.18)
  pers.width = persWidth
  pers.height = screenW.mul(0.25)
  pers.transform.y = screenH.mul(0.65)
  pers.transform.x = screenW.mul(0.12)

  tank.width = screenW.mul(0.15)
  tank.height = screenW.mul(0.23)
  tank.transform.y = screenH.mul(0.66)
  tank.transform.x = screenW.mul(1)

  // параметры для бэкграунда
  backImage.forEach(img => {
    img.width = screenW.mul(6.3)
    img.height = screenH.mul(1)
    img.transform.y = startPoint
  })

  frontFirst.transform.x = startPoint
  frontSecond.transform.x = startFrontSecond
  back.transform.x = startPoint

  // параметры для user rectangle
  const rightUser = widthImageUser.mul(8.28)
  const leftUser = widthImageUser.mul(4.8).neg()

  user.width = widthImageUser
  user.height = screenW.mul(0.64)
  user.transform.x = rightUser
  user.transform.y = widthImageUser.div(2)

  const state = {
    isPlay: false
  }

  // time drivers for animations
  const stageFrontTD = Animation.timeDriver({
    durationMilliseconds: 7000,
    loopCount: Infinity,
    mirror: false
  })

  const stageBackTD = Animation.timeDriver({
    durationMilliseconds: 12000,
    loopCount: Infinity,
    mirror: false
  })

  const stageTankTD = Animation.timeDriver({
    durationMilliseconds: 2000,
    loopCount: Infinity,
    mirror: false
  })

  // camera texture animation
  const initUserAnimation = () => {
    const sampler = Animation.samplers.linear(rightUser.pinLastValue(), leftUser.pinLastValue())

    const animationStage = Animation.animate(stageFrontTD, sampler)

    user.transform.x = animationStage

    stageFrontTD.start()
  }

  // background animation
  const initFrontAnime = () => {
    const samplerFirst = Animation.samplers.linear(startPoint, leftFrontFirst.pinLastValue())
    const samplerSecond = Animation.samplers.linear(startFrontSecond.pinLastValue(), startPoint)
    const samplerBack = Animation.samplers.linear(startPoint, leftBack.pinLastValue())

    const animationStage1 = Animation.animate(stageFrontTD, samplerFirst)
    const animationStage2 = Animation.animate(stageFrontTD, samplerSecond)
    const animationStage3 = Animation.animate(stageBackTD, samplerBack)

    frontFirst.transform.x = animationStage1
    frontSecond.transform.x = animationStage2
    back.transform.x = animationStage3

    stageFrontTD.start()
    stageBackTD.start()
  }

  const persUp = screenW.mul(0.72)
  const persDown = screenH.mul(0.65)

  // pers jump
  const initPersJump = () => {
    const sampler = Animation.samplers.easeInOutQuint(persDown.pinLastValue(), persUp.pinLastValue())

    const stageTD = Animation.timeDriver({
      durationMilliseconds: 600,
      loopCount: 2,
      mirror: true
    })

    const animationStage = Animation.animate(stageTD, sampler)

    pers.transform.y = animationStage
    stageTD.start()

    stageTD.onCompleted().subscribe(() => {
      material.diffuse = runSeq
    })
  }

  const rightHide = screenW.mul(1)
  const leftHide = screenW.mul(0.22).neg()

  // tank animation
  const initTankAnimation = () => {
    const sampler = Animation.samplers.linear(rightHide.pinLastValue(), leftHide.pinLastValue())

    const animationStage = Animation.animate(stageTankTD, sampler)

    tank.transform.x = animationStage

    stageTankTD.start()
  }

  const endedGame = () => {
    state.isPlay = true
    material.diffuse = collider
    stageFrontTD.stop()
    stageBackTD.stop()
    stageTankTD.stop()
  }

  // collider
  const collide = () => {
    tank.transform.y.add(tank.height).gt(pers.transform.y.add(pers.height)).and(pers.transform.y.lt(pers.transform.y.add(tank.height))).monitor().subscribe(evt => {
      pers.isYHit = evt.newValue
    })

    Reactive.and(pers.transform.x.add(pers.width).gt(tank.transform.x), (pers.transform.x.add(20).lt(tank.transform.x.add(tank.width)))).monitor().subscribe(evt => {
      if (!pers.isYHit && !state.isPlay) {
        Diagnostics.log('1')
        endedGame()
      }
    })
  }

  let isStart = true
  let isRun = false
  let isBlink = true

  TouchGestures.onTap().subscribe((gesture) => {
    if (isStart) {
      Instruction.bind(false, 'tap_to_start')
      Instruction.bind(true, 'blink_eyes')
      initFrontAnime()
      initUserAnimation()
      initTankAnimation()
      collide()
      isStart = false
    }

    if (isRun) return
    isRun = true
  })

  FaceGestures.onBlink(face).subscribe(() => {
    if (isBlink) {
      if (!state.isPlay) {
        if (isRun) {
          Instruction.bind(false, 'blink_eyes')
          initPersJump()
          material.diffuse = jumpSeq
          jumpSeq.currentFrame = 1
        }
      }
    }
  })
})()
