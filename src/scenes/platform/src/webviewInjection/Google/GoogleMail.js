const injector = require('../injector')
const {ipcRenderer, remote} = require('electron')
const GinboxApi = require('./GinboxApi')
const GmailApi = require('./GmailApi')
const GoogleService = require('./GoogleService')
const GmailChangeEmitter = require('./GmailChangeEmitter')
const GinboxChangeEmitter = require('./GinboxChangeEmitter')
const {
  WB_BROWSER_WINDOW_ICONS_IN_SCREEN,
  WB_BROWSER_OPEN_MESSAGE,
  WB_BROWSER_COMPOSE_MESSAGE
} = remote.require('./shared/ipcEvents')

class GoogleMail extends GoogleService {
  /* **************************************************************************/
  // Lifecycle
  /* **************************************************************************/

  constructor () {
    super()
    this.changeEmitter = null

    this.sidebarStylesheet = document.createElement('style')
    this.sidebarStylesheet.innerHTML = `
      [href="#inbox"][data-ved]>* {
        max-height:33px !important;
        margin-top: 22px;
        background-position-x: center;
      }
      [jsaction="global.toggle_main_menu"] {
        margin-top: 5px;
      }
      [jsaction="global.toggle_main_menu"] ~ [data-action-data] {
        margin-top: 21px;
      }
    `

    // Inject some styles
    injector.injectStyle(`
      a[href*="/SignOutOptions"] {
        visibility: hidden !important;
      }
    `)

    // Bind our listeners
    ipcRenderer.on(WB_BROWSER_WINDOW_ICONS_IN_SCREEN, this.handleWindowIconsInScreenChange.bind(this))
    ipcRenderer.on(WB_BROWSER_OPEN_MESSAGE, this.handleOpenMesage.bind(this))

    if (this.isGmail) {
      this.loadGmailAPI()
      ipcRenderer.on(WB_BROWSER_COMPOSE_MESSAGE, this.handleComposeMessageGmail.bind(this))
    }
    if (this.isGinbox) {
      this.loadInboxAPI()
      ipcRenderer.on(WB_BROWSER_COMPOSE_MESSAGE, this.handleComposeMessageGinbox.bind(this))
    }
  }

  /* **************************************************************************/
  // Properties
  /* **************************************************************************/

  get isGmail () { return window.location.host.indexOf('mail.google') !== -1 }
  get isGinbox () { return window.location.host.indexOf('inbox.google') !== -1 }

  /* **************************************************************************/
  // Loaders
  /* **************************************************************************/

  /**
  * Loads the GMail API
  */
  loadGmailAPI () {
    this.changeEmitter = new GmailChangeEmitter()
  }

  /**
  * Loads the inbox API
  */
  loadInboxAPI () {
    this.changeEmitter = new GinboxChangeEmitter()
  }

  /* **************************************************************************/
  // Event handlers
  /* **************************************************************************/

  /**
  * Handles the window icons in the screen chaning
  * @param evt: the event that fired
  * @param data: the data sent with the event
  */
  handleWindowIconsInScreenChange (evt, data) {
    if (data.inscreen) {
      if (!this.sidebarStylesheet.parentElement) {
        document.head.appendChild(this.sidebarStylesheet)
      }
    } else {
      if (this.sidebarStylesheet.parentElement) {
        this.sidebarStylesheet.parentElement.removeChild(this.sidebarStylesheet)
      }
    }
  }

  /**
  * Handles a message open call
  * @param evt: the event that fired
  * @param data: the data sent with the event
  */
  handleOpenMesage (evt, data) {
    if (this.isGmail) {
      window.location.hash = 'inbox/' + data.messageId
    }
  }

  /**
  * Handles opening the compose ui and prefills relevant items
  * @param evt: the event that fired
  * @param data: the data that was sent with the event
  */
  handleComposeMessageGmail (evt, data) {
    GmailApi.composeMessage(data)
  }

  /**
  * Handles opening the compose ui and prefills relevant items
  * @param evt: the event that fired
  * @param data: the data that was sent with the event
  */
  handleComposeMessageGinbox (evt, data) {
    GinboxApi.composeMessage(data)
  }
}

module.exports = GoogleMail
