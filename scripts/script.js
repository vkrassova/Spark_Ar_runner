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

  pers.width = persWidth
  pers.height = screenW.mul(0.32)
  pers.transform.y = screenH.mul(0.62)
  pers.transform.x = screenW.mul(0.12)

  const backImage = [frontFirst, frontSecond, back]

  const startPoint = 0
  const startFrontSecond = screenW.mul(6.3)
  const leftFrontFirst = screenW.mul(6.3).neg()
  // const leftFrontSecond = 0

  backImage.forEach(img => {
    img.width = screenW.mul(6.3)
    img.height = screenH.mul(1)
    img.transform.y = startPoint
  })

  frontFirst.transform.x = startPoint
  frontSecond.transform.x = startFrontSecond
  back.transform.x = startPoint

  const widthImageUser = screenW.mul(0.48)

  const rightUser = widthImageUser.mul(8.29)
  const leftUser = widthImageUser.mul(4.8).neg()

  user.width = widthImageUser
  user.height = screenW.mul(0.64)

  user.transform.x = rightUser
  user.transform.y = widthImageUser.div(2)

  // анимация текстуры с камеры
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

  // анимация бэкграунда
  const initFrontFirstAnime = () => {
    const samplerFirst = Animation.samplers.linear(startPoint, leftFrontFirst.pinLastValue())
    const samplerSecond = Animation.samplers.linear(startFrontSecond.pinLastValue(), startPoint)

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
    const animationStage3 = Animation.animate(stage1TD, samplerFirst)

    frontFirst.transform.x = animationStage1
    frontSecond.transform.x = animationStage2
    back.transform.x = animationStage3

    stageTD.start()
    stage1TD.start()
  }

  let isOnce = true
  let isRun = false

  TouchGestures.onTap().subscribe((gesture) => {
    if (isOnce) {
      Instruction.bind(false, 'tap_to_start')
      Instruction.bind(true, 'blink_eyes')
      initFrontFirstAnime()
      initUserAnimation()
      isOnce = false
    }
  })
})()
