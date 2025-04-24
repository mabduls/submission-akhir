// scripts/pages/app.js
import { routes, checkAuth, navigateToUrl } from '../routes/routes';
import { getAccessToken } from '../data/api';
import { getActivePathname, parseActivePathname, parsePathname } from '../routes/url-parser';
import LoginPresenter from '../pages/auth/login/login-presenter';
import RegisterPresenter from '../pages/auth/register/register-presenter';
import HomePresenter from '../pages/home/home-presenter';
import CreatePresenter from '../pages/create/create-presenter';
import DetailPresenter from '../pages/detail/detail-presenter';

class App {
  constructor({ content }) {
    this._content = content;
    this._initialAppShell();
  }

  _initialAppShell() {
  }

  async renderPage() {
    try {
      const pathname = getActivePathname();
      const { resource, id } = parsePathname(pathname);
      
      // Determine the route pattern
      let routePattern = pathname === '/' ? '/' : `/${resource || ''}`;
      if (id) {
        routePattern += '/:id';
      }
      
      const route = routes[routePattern] || routes['/'];
  
      if (!checkAuth(route)) {
        return;
      }
  
      this._content.innerHTML = route.template;
  
      // Handle initialization based on exact path matches
      if (pathname === '/') {
        await this._initLoginPage();
      } else if (pathname === '/register') {
        await this._initRegisterPage();
      } else if (pathname === '/home') {
        await this._initHomePage();
        await this.#checkPushSubscription();
      } else if (pathname === '/create') {
        await this._initCreatePage();
      } else if (resource === 'detail' && id) {
        await this._initDetailPage(id);
      } else {
        console.warn(`No handler for route: ${pathname}`);
        // Redirect to home if authenticated, or to login if not
        if (getAccessToken()) {
          navigateToUrl('/home');
        } else {
          navigateToUrl('/');
        }
      }
    } catch (error) {
      console.error('Failed to render page:', error);
      // Fallback UI for errors
      this._content.innerHTML = `
        <div style="color: white; padding: 2rem; text-align: center;">
          <h2>Terjadi Error</h2>
          <p>${error.message}</p>
          <button onclick="window.location.hash='#/'">Kembali ke Halaman Login</button>
        </div>
      `;
    }
  }

  async #checkPushSubscription() {
    try {
      const { isCurrentPushSubscriptionAvailable } = await import('../utils/notification-helper');
      const isSubscribed = await isCurrentPushSubscriptionAvailable();
      console.log('Push subscription status:', isSubscribed);

      const subscribeBtn = document.getElementById('subscribeBtn');
      const unsubscribeBtn = document.getElementById('unsubscribeBtn');
      if (subscribeBtn && unsubscribeBtn) {
        subscribeBtn.style.display = isSubscribed ? 'none' : 'block';
        unsubscribeBtn.style.display = isSubscribed ? 'block' : 'none';
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  }

  async _initLoginPage() {
    await customElements.whenDefined('login-page');
    const loginPage = this._content.querySelector('login-page');
    if (loginPage) {
      console.log('Initializing LoginPresenter...');
      LoginPresenter.init({
        view: loginPage,
        navigateTo: '/home'
      });
    }
  }

  async _initRegisterPage() {
    await customElements.whenDefined('register-page');
    const registerPage = this._content.querySelector('register-page');
    if (registerPage) {
      RegisterPresenter.init({
        view: registerPage,
        navigateTo: '/'
      });
    }
  }

  async _initHomePage() {
    try {
      await customElements.whenDefined('home-page');
      const homePage = this._content.querySelector('home-page');
      if (homePage) {
        HomePresenter.init({
          view: homePage,
          navigateTo: '/create'
        });
      }
    } catch (error) {
      console.error('Failed to init home:', error);
      this._content.innerHTML = `
        <div style="color: white; padding: 2rem; text-align: center;">
          <h2>Terjadi Error</h2>
          <p>${error.message}</p>
          <button onclick="window.location.reload()">Muat Ulang</button>
        </div>
      `;
    }
  }

  async _initCreatePage() {
    await customElements.whenDefined('create-page');
    const createPage = this._content.querySelector('create-page');
    if (createPage) {
      CreatePresenter.init({ view: createPage });
    }
  }

  async _initDetailPage(id) {
    await customElements.whenDefined('detail-page');
    const detailPage = this._content.querySelector('detail-page');
    if (detailPage) {
      DetailPresenter.init({
        view: detailPage,
        storyId: id
      });
    }
  }
}

export default App;