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
const Time = require('Time')
const face = FaceTracking.face(0)

Instruction.bind(true, 'tap_to_start')

const screenScale = CameraInfo.previewScreenScale
const screenW = CameraInfo.previewSize.x.div(screenScale)
const screenH = CameraInfo.previewSize.y.div(screenScale);

(async function () {
  // const gameCanvas = await Scene.root.findFirst('game')
  const pers = await Scene.root.findFirst('pers')
  const tank = await Scene.root.findFirst('tank')
  const frontSecond = await Scene.root.findFirst('front_2')
  const frontFirst = await Scene.root.findFirst('front_1')
  const back = await Scene.root.findFirst('sity_back')
  const backImage = [frontFirst, frontSecond, back]
  const user = await Scene.root.findFirst('user')
  const scoreBg = await Scene.root.findFirst('score')
  const scoreText = await Scene.root.findFirst('score-text')
  const one = await Scene.root.findFirst('1')
  const two = await Scene.root.findFirst('2')
  const three = await Scene.root.findFirst('3')
  const scale = [one, two, three]

  const settings = {
    score: 0
  }

  for (const el of scale) {
    el.hidden = true
  }

  one.width = screenW.div(10)
  one.height = screenW.div(10)
  two.width = screenW.div(10)
  two.height = screenW.div(10)
  three.width = screenW.div(10)
  three.height = screenW.div(10)

  scoreBg.width = screenW.mul(0.6)
  scoreBg.height = screenH.mul(0.2)
  scoreBg.transform.x = screenW.mul(0.23)
  scoreText.transform.x = screenW.mul(0.24)
  scoreText.transform.y = 0

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

  // параметры для фоновых картинок
  for (const i of backImage) {
    i.width = screenW.mul(6.3)
    i.height = screenH.mul(1)
    i.transform.y = startPoint
  }

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
    durationMilliseconds: 1400,
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

  // tank animation
  const initTankAnimation = () => {
    const sampler = Animation.samplers.linear(rightHide.pinLastValue(), leftHide.pinLastValue())

    const animationStage = Animation.animate(stageTankTD, sampler)

    tank.transform.x = animationStage

    stageTankTD.start()
  }

  // collider
  const collide = () => {
    Reactive.and(
      tank.transform.y.add(tank.height).gt(pers.transform.y.add(pers.height)),
      pers.transform.y.lt(pers.transform.y.add(tank.height))
    ).monitor().subscribe(evt => {
      pers.isYHit = evt.newValue
    })

    Reactive.and(
      pers.transform.x.add(pers.width).gt(tank.transform.x),
      pers.transform.x.add(20).lt(tank.transform.x.add(tank.width.add(10)))
    ).monitor().subscribe(evt => {
      if (!pers.isYHit && !state.isPlay) {
        state.isPlay = true
        Diagnostics.log(state.isPlay)
        endedGame()
      }
    })
  }

  // pers jump
  const initPersJump = () => {
    const sampler = Animation.samplers.easeInOutSine(persDown.pinLastValue(), persUp.pinLastValue())

    const stageTD = Animation.timeDriver({
      durationMilliseconds: 500,
      loopCount: 2,
      mirror: true
    })

    const animationStage = Animation.animate(stageTD, sampler)

    pers.transform.y = animationStage
    stageTD.start()

    stageTD.onCompleted().subscribe(() => {
      material.diffuse = runSeq
      if (!state.isPlay) {
        scoreText.text = `${++settings.score}`
        Diagnostics.log(state.isPlay)
        Diagnostics.log(settings.score)
        if (settings.score === 4) {
          one.hidden = false
        }
        if (settings.score === 8) {
          two.hidden = false
        }
        if (settings.score === 12) {
          three.hidden = false
        }
      }
      stageTD.reset()
    })
  }

  const rightHide = screenW.mul(1)
  const leftHide = screenW.mul(0.22).neg()

  const startGame = () => {
    Instruction.bind(false, 'tap_to_start')
    Instruction.bind(true, 'blink_eyes')
    scoreText.text = `${settings.score}`
    initFrontAnime()
    initUserAnimation()
    initTankAnimation()
    collide()
    isStart = false
  }

  let isStart = true
  let isRun = false
  let isBlink = true

  const endedGame = () => {
    material.diffuse = collider
    stageFrontTD.stop()
    stageBackTD.stop()
    stageTankTD.stop()
    isBlink = false
  }

  TouchGestures.onTap().subscribe((gesture) => {
    if (isStart) {
      if (!state.isPlay) {
        startGame()
      }
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
