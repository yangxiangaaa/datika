import CryptoJS from 'crypto-js/md5';

const md5 = (value) => CryptoJS(value).toString();

export default md5;
