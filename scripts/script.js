const Scene = require('Scene')
const Patches = require('Patches')
const Reactive = require('Reactive')
const FaceTracking = require('FaceTracking')
const FaceGestures = require('FaceGestures')
const TouchGestures = require('TouchGestures')
const Instruction = require('Instruction')
const Animation = require('Animation')
const Textures = require('Textures')
const CameraInfo = require('CameraInfo')
const Time = require('Time')
const Diagnostics = require('Diagnostics')

const face = FaceTracking.face(0)

Instruction.bind(true, 'tap_to_start')

const screenScale = CameraInfo.previewScreenScale
const screenW = CameraInfo.previewSize.x.div(screenScale)
const screenH = CameraInfo.previewSize.y.div(screenScale);

(async function () {
  const pers = await Scene.root.findFirst('pers')
  const frontSecond = await Scene.root.findFirst('front_2')
  const frontFirst = await Scene.root.findFirst('front_1')
  const back = await Scene.root.findFirst('sity_back')
  const user = await Scene.root.findFirst('user')
  const persWidth = screenW.mul(0.26)

  const startPoint = 0
  const startFrontSecond = screenW.mul(6.3)
  const leftFrontFirst = screenW.mul(6.3).neg()
  const leftBack = screenW.mul(5.3).neg()

  const persRun = await Textures.findFirst('run_seq')

  pers.width = persWidth
  pers.height = screenW.mul(0.32)
  pers.transform.y = screenH.mul(0.62)
  pers.transform.x = screenW.mul(0.12)

  const backImage = [frontFirst, frontSecond, back]

  backImage.forEach(img => {
    img.width = screenW.mul(6.3)
    img.height = screenH.mul(1)
    img.transform.y = startPoint
  })

  frontFirst.transform.x = startPoint
  frontSecond.transform.x = startFrontSecond
  back.transform.x = startPoint

  const widthImageUser = screenW.mul(0.48)

  const rightUser = widthImageUser.mul(8.28)
  const leftUser = widthImageUser.mul(4.8).neg()

  user.width = widthImageUser
  user.height = screenW.mul(0.64)
  user.transform.x = rightUser
  user.transform.y = widthImageUser.div(2)

  // camera texture animation
  const initUserAnimation = () => {
    const sampler = Animation.samplers.linear(rightUser.pinLastValue(), leftUser.pinLastValue())

    const stageTD = Animation.timeDriver({
      durationMilliseconds: 7000,
      loopCount: Infinity,
      mirror: false
    })

    const animationStage = Animation.animate(stageTD, sampler)

    user.transform.x = animationStage

    stageTD.start()
  }

  // background animation
  const initFrontFirstAnime = () => {
    const samplerFirst = Animation.samplers.linear(startPoint, leftFrontFirst.pinLastValue())
    const samplerSecond = Animation.samplers.linear(startFrontSecond.pinLastValue(), startPoint)
    const samplerBack = Animation.samplers.linear(startPoint, leftBack.pinLastValue())

    const stageTD = Animation.timeDriver({
      durationMilliseconds: 7000,
      loopCount: Infinity,
      mirror: false
    })

    const stage1TD = Animation.timeDriver({
      durationMilliseconds: 12000,
      loopCount: Infinity,
      mirror: false
    })

    const animationStage1 = Animation.animate(stageTD, samplerFirst)
    const animationStage2 = Animation.animate(stageTD, samplerSecond)
    const animationStage3 = Animation.animate(stage1TD, samplerBack)

    frontFirst.transform.x = animationStage1
    frontSecond.transform.x = animationStage2
    back.transform.x = animationStage3

    stageTD.start()
    stage1TD.start()
  }

  const persUp = screenW.mul(0.8)
  const persDown = screenH.mul(0.62)

  // pers jump
  const initPersJump = () => {
    const sampler = Animation.samplers.easeInOutQuint(persDown.pinLastValue(), persUp.pinLastValue())

    const stageTD = Animation.timeDriver({
      durationMilliseconds: 400,
      loopCount: 2,
      mirror: true
    })

    const animationStage = Animation.animate(stageTD, sampler)

    pers.transform.y = animationStage

    stageTD.start()
  }

  let isStart = true
  let isRun = false
  let isBlink = true

  TouchGestures.onTap().subscribe((gesture) => {
    if (isStart) {
      Instruction.bind(false, 'tap_to_start')
      Instruction.bind(true, 'blink_eyes')
      initFrontFirstAnime()
      initUserAnimation()
      isStart = false
    }

    if (isRun) return
    isRun = true
  })

  FaceGestures.onBlink(face).subscribe(() => {
    if (isBlink) {
      if (isRun) {
        Instruction.bind(false, 'blink_eyes')
        initPersJump()
      }
    }
  })
})()
