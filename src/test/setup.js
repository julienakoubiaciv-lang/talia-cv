import '@testing-library/jest-dom';

// localStorage est fourni par jsdom — on le remet à zéro avant chaque test
beforeEach(() => {
  localStorage.clear();
});
