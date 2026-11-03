import {
  expect,
  it,
  jest,
} from '@jest/globals';


const mockRootRender = jest.fn();

const mockCreateRoot = jest.fn(() => ({
  render: mockRootRender,
}));

const mockRegisterServiceWorker = jest.fn();


jest.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));


jest.mock('../App.tsx', () => ({
  __esModule: true,
  default: () => (
    <div>Mock CareConnect App</div>
  ),
}));


jest.mock('../components/InstallPrompt.tsx', () => ({
  __esModule: true,
  default: () => (
    <div>Mock Install Prompt</div>
  ),
}));


jest.mock('../pwa/registerSW.ts', () => ({
  registerServiceWorker:
    mockRegisterServiceWorker,
}));


it(
  'mounts the active TSX application and starts PWA registration',
  async () => {

    document.body.innerHTML =
      '<div id="root"></div>';

    await import('../main.tsx');

    expect(
      mockCreateRoot,
    ).toHaveBeenCalledWith(
      document.getElementById('root'),
    );

    expect(
      mockRootRender,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockRegisterServiceWorker,
    ).toHaveBeenCalledTimes(1);
  },
);