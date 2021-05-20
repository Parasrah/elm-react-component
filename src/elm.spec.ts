import * as R from 'ramda'

import createMock, { ModuleInit as StepInit } from './elm.mock'
import { Elm, ElmModule } from '.'

type CreateElm = () => Elm

type CreateStepInit = () => StepInit

/*
 * The point of this is to ensure that the mock works properly
 */

describe('elm mock', () => {
  describe('with multiple modules', () => {
    function createSteps (): CreateStepInit[] {
      return [
        () => ({
          incoming: ['abra'],
          outgoing: ['cada', 'bra'],
          path: ['First', 'Second'],
        }),
        () => ({
          incoming: ['hello', 'friendly', 'world'],
          outgoing: ['goodbye', 'favorite', 'tv', 'show'],
          path: ['First', 'Overlap'],
        }),
        () => ({
          incoming: ['Caps', 'shoUld', 'Work'],
          outgoing: [],
          path: ['No', 'Overlap'],
        }),
      ]
    }

    function createElm () {
      return createMock(R.map(R.call, createSteps()))
    }

    withIncomingPorts(createElm, createSteps())

    withOutgoingPorts(createElm, createSteps())

    withIncomingAndOutgoing(createElm, createSteps())
  })

  describe('with single module', () => {
    function createSteps (): CreateStepInit[] {
      return [
        () => ({
          incoming: ['a', 'b', 'c'],
          outgoing: ['d', 'e', 'f'],
          path: ['First', 'Second', 'Third'],
        }),
      ]
    }
    function createElm () {
      return createMock(R.map(R.call, createSteps()))
    }

    withIncomingPorts(createElm, createSteps())

    withOutgoingPorts(createElm, createSteps())

    withIncomingAndOutgoing(createElm, createSteps())
  })
})

function withIncomingAndOutgoing (createElm: CreateElm, steps: CreateStepInit[]) {
  describe('with both incoming and outgoing ports', () => {
    steps.forEach(R.curry(testIncomingPorts)(createElm))
    steps.forEach(R.curry(testOutgoingPorts)(createElm))
  })
}

function withIncomingPorts (createElm: CreateElm, steps: CreateStepInit[]) {
  describe('with incoming ports', () => {
    steps
      .map(createStep => () => ({ ...createStep(), outgoing: [] }))
      .forEach(R.curry(testIncomingPorts)(createElm))
  })
}

function testIncomingPorts (createElm: CreateElm, createStep: CreateStepInit) {
  let elm: Elm
  let step: StepInit

  beforeEach(() => {
    elm = createElm()
    step = createStep()
  })

  it('should have "send" for incoming ports', () => {
    const mod = resolve(step.path, elm)
    expect(mod?.init).toBeTruthy()

    const app = mod?.init({
      node: ({} as HTMLInputElement),
      flags: {},
    })

    expect(app?.ports).toBeTruthy()
    step.incoming.forEach(i => expect(app?.ports[i].send).toBeTruthy())
  })

  it('should not have "subscribe" for incoming ports', () => {
    const mod = resolve(step.path, elm)
    expect(mod?.init).toBeTruthy()

    const app = mod?.init({
      node: ({} as HTMLInputElement),
      flags: {},
    })

    expect(app?.ports).toBeTruthy()
    step.incoming.forEach(i => expect(app?.ports[i].subscribe).toBeFalsy())
  })

  it('should not have "unsubscribe" for incoming ports', () => {
    const mod = resolve(step.path, elm)
    expect(mod?.init).toBeTruthy()

    const app = mod?.init({
      node: ({} as HTMLInputElement),
      flags: {},
    })

    expect(app?.ports).toBeTruthy()
    step.incoming.forEach(i => expect(app?.ports[i].unsubscribe).toBeFalsy())
  })
}

function withOutgoingPorts (createElm: CreateElm, steps: CreateStepInit[]) {
  describe('with outgoing ports', () => {
    steps
      .map(createStep => () => ({ ...createStep(), incoming: [] }))
      .forEach(R.curry(testOutgoingPorts)(createElm))
  })
}

function testOutgoingPorts (createElm: CreateElm, createStep: CreateStepInit) {
  let elm: Elm
  let step: StepInit

  beforeEach(() => {
    elm = createElm()
    step = createStep()
  })

  it('should have "subscribe" for outgoing ports', () => {
    const mod = resolve(step.path, elm)
    expect(mod?.init).toBeTruthy()

    const app = mod?.init({
      node: ({} as HTMLInputElement),
      flags: {},
    })

    expect(app?.ports).toBeTruthy()
    step.outgoing.forEach(i => expect(app?.ports[i]?.subscribe).toBeTruthy())
  })

  it('should have "unsubscribe" for outgoing ports', () => {
    const mod = resolve(step.path, elm)
    expect(mod?.init).toBeTruthy()

    const app = mod?.init({
      node: ({} as HTMLInputElement),
      flags: {},
    })

    expect(app?.ports).toBeTruthy()
    step.outgoing.forEach(i => expect(app?.ports[i]?.unsubscribe).toBeTruthy())
  })

  it('should not have "send" for outgoing ports', () => {
    const mod = resolve(step.path, elm)
    expect(mod?.init).toBeTruthy()

    const app = mod?.init({
      node: ({} as HTMLInputElement),
      flags: {},
    })

    expect(app?.ports).toBeTruthy()
    step.outgoing.forEach(i => expect(app?.ports[i]?.send).toBeFalsy())
  })
}

function resolve (path: string[], elm: Elm): ElmModule | undefined {
  return R.path(['Elm', ...path], elm)
}
