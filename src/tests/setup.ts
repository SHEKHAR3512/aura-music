import '@testing-library/jest-dom/vitest';

// Polyfill window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill window.scrollTo
window.scrollTo = () => {};

// Mock AudioContext and HTMLMediaElement for headless testing
class MockAudioContext {
  state = 'running';
  createGain() {
    return {
      connect: () => {},
      gain: { value: 1, setValueAtTime: () => {} },
    };
  }
  createBiquadFilter() {
    return {
      connect: () => {},
      frequency: { value: 1000 },
      gain: { value: 0 },
      Q: { value: 1 },
      type: 'peaking',
    };
  }
  createAnalyser() {
    return {
      connect: () => {},
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: () => {},
      getByteTimeDomainData: () => {},
    };
  }
  createStereoPanner() {
    return {
      connect: () => {},
      pan: { value: 0, setValueAtTime: () => {} },
    };
  }
  createMediaElementSource() {
    return {
      connect: () => {},
    };
  }
  close() {
    return Promise.resolve();
  }
}

// @ts-ignore
window.AudioContext = MockAudioContext;
// @ts-ignore
window.webkitAudioContext = MockAudioContext;
