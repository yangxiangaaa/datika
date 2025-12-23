const defaultUser = {
  UserID: 'demo-user',
  UserName: '示例教师',
  SchoolID: 'demo-school',
  UserType: 1,
  ISUniversity: 0,
};

const defaultBaseInfo = {
  BasicWebRootUrl: '',
  BasicWebServerUrl: '',
};

export const ensureMockSession = () => {
  if (!sessionStorage.getItem('UserInfo')) {
    sessionStorage.setItem('UserInfo', JSON.stringify(defaultUser));
  }
  if (!sessionStorage.getItem('PapergradebaseInfo')) {
    sessionStorage.setItem('PapergradebaseInfo', JSON.stringify(defaultBaseInfo));
  }
};

ensureMockSession();
