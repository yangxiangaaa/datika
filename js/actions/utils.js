import {getData,postData} from "../../../common/js/fetch";

import config from '../../../common/js/config';








//获取数据以及封装数据格式
export const getGetData =  async (url,level,api=config.WebRootUrl,mode='cors',arr=[500,400,401,403]) =>{
    try {

        let fetchAsync = '';

        try {

            fetchAsync = await getData(api+url,level,mode,true,arr);

        }
        catch (e) {

            return  e;

        }

        let json = await fetchAsync.json();

        return json;

    }
    catch (e) {

        return e;

    }
};
//调用post接口
export const getPostData = async (url,data,level,api=config.WebRootUrl,content_type='json',arr=[500,400,401,403]) =>{

    try {
        let fetchAsync = '';

        try {

            fetchAsync = await postData(api+url,data,level,content_type,true,arr);

        }
        catch (e) {
            return  e;
        }

        let json = await fetchAsync.json();

        return  json;

    }
    catch (e) {

        return e;

    }

};