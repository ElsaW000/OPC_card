// custom-tab-bar.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: 'pages/home/home', text: 'GongZuoTai', icon: '\uD83D\uDCCA' },
      { pagePath: 'pages/contacts/contacts', text: 'LianXiRen', icon: '\uD83D\uDC65' },
      { pagePath: 'pages/mycards/mycards', text: 'WoDeMingPian', icon: '\uD83D\uDCC7', isCenter: true },
      { pagePath: 'pages/management/management', text: 'GuanLi', icon: '\u2699\uFE0F' }
    ]
  },

  lifetimes: {
    attached() {
      console.log('custom-tab-bar attached');
      this.updateSelected();
    },
    ready() {
      console.log('custom-tab-bar ready');
    }
  },

  pageLifetimes: {
    show() {
      console.log('custom-tab-bar show');
      this.updateSelected();
    }
  },

  methods: {
    updateSelected() {
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      
      const currentPage = pages[pages.length - 1];
      const currentPath = currentPage.route;
      const index = this.data.list.findIndex(item => item.pagePath === currentPath);
      
      console.log('Current path:', currentPath, 'Index:', index);
      
      if (index !== -1) {
        this.setData({ selected: index });
      }
    },

    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      console.log('Switch tab to:', path, 'Index:', index);
      wx.switchTab({ url: '/' + path });
      this.setData({ selected: parseInt(index) });
    }
  }
});
