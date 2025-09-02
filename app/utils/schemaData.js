const GROUP_DEFAULT = {
  groupId: '',
  subject: '',
  joinApprovalMode: false,
  visible: false,
  link: '',
  publicFeatures: [],
  accessFeatures: 'everyone',
  activityScore: false,
  maxStrike: 3,
  wordBlocker: {
    enable: false,
    message: '',
    list: []
  },
  antiMention: {
    enable: false,
    message: '',
  },
  welcome: {
    enable: false,
    message: ''
  },
  lang: 'en'
};

const PARTICIPANT_DEFAULT = {
  jid: '',
  groupId: '',
  isAdmin: false,
  strike: 0,
  score: 0
};

const USER_DEFAULT = {
  jid: '',
  pushName: '',
  exp: 0,
  subscription: {
    type: 'basic',
    limit: 500,
    remaining: 500,
    expiredAt: null
  },
  banStatus: {
    enable: false,
    message: '',
    expiredAt: null
  },
  balance: 0,
  token: '',
  lang: 'en'
};

const BOT_DEFAULT = {
  prefixes: ['/', '#', '!'],
  owners: [ '6285174902345' ],
};

export { GROUP_DEFAULT, PARTICIPANT_DEFAULT, USER_DEFAULT, BOT_DEFAULT };