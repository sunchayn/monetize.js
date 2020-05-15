/* eslint-disable no-undef,no-alert */
// eslint-disable-next-line import/no-extraneous-dependencies
import { v4 as uuidv4 } from 'uuid';
import FakeMonetizationAPI from './FakeMonetizationAPI';
import './Simulator.scss';
import simulationPanel from './panel.html';

const $events = {
  monetizationstart: {
    detail: {
      paymentPointer: '$wallet.example.com/alice',
    },
  },

  monetizationpending: {
    detail: {
      paymentPointer: '$wallet.example.com/alice',
    },
  },
  monetizationprogress: {
    detail: {
      paymentPointer: '$wallet.example.com/alice',
      amount: '5421',
      assetCode: 'USD',
      assetScale: 6,
    },
  },
  monetizationstop: {
    detail: {
      paymentPointer: '$wallet.example.com/alice',
      finalized: false,
    },
  },
};

// todo: Stop the stream when document visibility is changed.
export default class Simulator {
  constructor() {
    this._requestid = uuidv4();
    this._watched = false;

    this._setup();
    this._inject();
  }

  _setup() {
    if (!monetize.isEnabled()) {
      document.monetization = new FakeMonetizationAPI();
      monetize.refresh();
    }
  }

  _inject() {
    this._injectSimulatorPanel();

    this._determinePanelStatus();

    this._bindEventListeners();

    if (monetize.activePointer) {
      this._watchMonetizationEvents();
    }

    this._observeHead();
  }

  _determinePanelStatus() {
    if (monetize.activePointer) {
      // A pointer has been detected in the page.
      this._sectionEnabled.classList.remove('is-hidden');
      this._sectionDisabled.classList.add('is-hidden');
    } else {
      // No pointer has been detected in the page.
      this._sectionEnabled.classList.add('is-hidden');
      this._sectionDisabled.classList.remove('is-hidden');
    }
  }

  _injectSimulatorPanel() {
    const host = document.createElement('div');
    host.innerHTML = simulationPanel;

    document.body.append(host.firstChild);

    this._simulateBtn = document.getElementById('js-simulate');
    this._stopBtn = document.getElementById('js-stop');
    this._icon = document.getElementById('js-state-icon');
    this._sectionEnabled = document.getElementById('js-simulator-enabled');
    this._sectionDisabled = document.getElementById('js-simulator-disabled');
  }

  _bindEventListeners() {
    this._simulateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.target.blur();
      this._simulate();
    });

    this._stopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.target.blur();
      this._fireStoppedEvent();
    });
  }

  _simulate() {
    const start = 'monetizationstart';
    const pending = 'monetizationpending';
    const progress = 'monetizationprogress';

    this._dispatchEvent(pending);

    const eventTimeout = this._randomNumber(300, 700);
    setTimeout(() => {
      document.monetization.state = 'started';
      this._dispatchEvent(start);
    }, eventTimeout);

    setTimeout(() => {
      if (!monetize.isStopped()) {
        this._dispatchEvent(progress);
      }

      const timer = setInterval(() => {
        if (monetize.isStopped()) {
          clearInterval(timer);
          return;
        }

        this._dispatchEvent(progress);
      }, 1000);
    }, eventTimeout);
  }

  _dispatchEvent(event) {
    const eventData = new CustomEvent(event, this._getEvent(event));
    document.monetization.dispatchEvent(eventData);
  }

  _watchMonetizationEvents() {
    monetize.when('pending').then(() => {
      this._icon.classList.remove('is-sending', 'is-stopped');
      this._icon.classList.add('is-pending');
      this._icon.setAttribute('title', 'pending...');
      this._simulationDisallowed();
    });

    monetize.when('progress').then(() => {
      this._icon.classList.remove('is-pending', 'is-stopped');
      this._icon.classList.add('is-sending');
      this._icon.setAttribute('title', 'sending...');
      this._simulationDisallowed();
    });

    monetize.when('stop').then(() => {
      this._icon.classList.remove('is-pending', 'is-sending');
      this._icon.classList.add('is-stopped');
      this._icon.setAttribute('title', 'stopped!');
      this._simulationAllowed();
    });

    this._watched = true;
  }

  _observeHead() {
    (new MutationObserver(() => {
      if (!this._watched) {
        this._watchMonetizationEvents();
      }

      const pointer = monetize.detectPointerFromMetaTag();

      if (!pointer) {
        this._fireStoppedEvent();
      }

      this._determinePanelStatus();
    })).observe(document.head, { childList: true });
  }

  _simulationAllowed() {
    this._stopBtn.setAttribute('disabled', '');
    this._simulateBtn.removeAttribute('disabled');
  }

  _simulationDisallowed() {
    this._stopBtn.removeAttribute('disabled');
    this._simulateBtn.setAttribute('disabled', '');
  }

  _fireStoppedEvent() {
    // todo: Verify it stops when served over http
    const stopped = 'monetizationstop';
    document.monetization.state = 'stopped';
    // eslint-disable-next-line max-len
    document.monetization.dispatchEvent(new CustomEvent(stopped, this._getEvent(stopped)));
  }

  _getEvent(event) {
    const eventObj = $events[event] || {};
    eventObj.detail.requestId = this._requestid;
    eventObj.detail.paymentPointer = monetize.activePointer;

    return eventObj;
  }

  _randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
