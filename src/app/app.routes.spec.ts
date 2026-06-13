import { routes } from './app.routes';

describe('application routes', () => {
  it('lazy loads all workspace features', () => {
    const children = routes[0].children ?? [];
    expect(children.filter((route) => route.loadComponent)).toHaveLength(4);
    expect(children.map((route) => route.path)).toEqual(['chat', 'prompts', 'knowledge', 'settings', '']);
  });

  it('resolves the chat feature', async () => {
    const chatRoute = routes[0].children?.find((route) => route.path === 'chat');
    expect(await chatRoute?.loadComponent?.()).toBeTruthy();
  });
});
