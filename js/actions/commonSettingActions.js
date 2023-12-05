const SHOW_ERROR_ALERT = 'SHOW_ERROR_ALERT';

const CLOSE_ERROR_ALERT = 'CLOSE_ERROR_ALERT';

const COMMON_SUBJECT_INFO_UPDATE = 'COMMON_SUBJECT_INFO_UPDATE';

const APP_LOADING_HIDE = 'APP_LOADING_HIDE';

const APP_LOADING_SHOW = 'APP_LOADING_SHOW';

const USER_INFO_UPDATE = 'USER_INFO_UPDATE';

const IDENTITY_CODE_OBJ_UPDATE = 'IDENTITY_CODE_OBJ_UPDATE'

const MODULE_INFO_UPDATE = 'MODULE_INFO_UPDATE';

const TAB_INDEX_UPDATE = 'TAB_INDEX_UPDATE';

const TEACHER_LIST_UPDATE = 'TEACHER_LIST_UPDATE';


const showErrorAlert = (dispatch,{title,abstract,littleTitle,ok,cancel,close,okShow,cancelShow,okTitle,cancelTitle}) => {

    return dispatch({

            type:SHOW_ERROR_ALERT,

            data:{

                type:'btn-error',

                title,
                abstract:abstract?abstract:'',
                littleTitle,

                ok:ok?ok:hideAlert(dispatch),

                cancel:cancel?cancel:hideAlert(dispatch),

                close:close?close:hideAlert(dispatch),

                okShow:okShow==='n'?'n':'y',

                cancelShow:cancelShow==='n'?'n':'y',

                okTitle,

                cancelTitle

            }

    })

};

const showWarnAlert = ({title,littleTitle,ok,cancel,close,okShow,cancelShow,abstract,okTitle,cancelTitle}) => {

    return dispatch=>{

        dispatch({

            type:SHOW_ERROR_ALERT,

            data:{

                type:'btn-warn',

                title,
                abstract:abstract?abstract:'',
                littleTitle,

                ok:ok?ok:hideAlert(dispatch),

                cancel:cancel?cancel:hideAlert(dispatch),

                close:close?close:hideAlert(dispatch),

                okShow:okShow==='n'?'n':'y',

                cancelShow:cancelShow==='n'?'n':'y',

                okTitle,

                cancelTitle

            }

        })

    }

};

const showSuccessAlert = ({title,hide}) => {

    return dispatch=>{

        dispatch({

            type:SHOW_ERROR_ALERT,

            data:{

                type:'success',

                title,

                hide:hide?hide:hideAlert(dispatch)

            }

        })

    }

};

const showQueryAlert = (dispatch, {title,littleTitle,ok,cancel,close,okShow,cancelShow,abstract,okTitle,cancelTitle}) => {

    return dispatch({

            type:SHOW_ERROR_ALERT,

            data:{

                type:'btn-query',

                title,
                abstract:abstract?abstract:'',
                littleTitle,

                ok:ok?ok:hideAlert(dispatch),

                cancel:cancel?cancel:hideAlert(dispatch),

                close:close?close:hideAlert(dispatch),

                okShow:okShow==='n'?'n':'y',

                cancelShow:cancelShow==='n'?'n':'y',

                okTitle,

                cancelTitle

            }

        })

};


const hideAlert = (dispatch) =>{

    return e=>dispatch({type:CLOSE_ERROR_ALERT});

};

//Frame组件状态更新

const moduleInfoUpdate = (data)=>{

    const { bannerRightBtn='',cnname='',enname='',productModuleName='',

        className='type1',topRight='',banner=false,bannerLeftType='',

        bannerContent='', image=''

    } = data;

    const payLoad = {bannerContent,bannerLeftType,cnname,enname,productModuleName,className,topRight,banner,bannerRightBtn,image};

    return {
        type:MODULE_INFO_UPDATE,
        data:payLoad
    }

};

//用户信息更新

const updateUserInfo = (data) => {

    return {
        type: USER_INFO_UPDATE,
        data
    }

};

//用户身份信息更新

const updateIdentityCodeObj = (data) => {
    return {
        type: IDENTITY_CODE_OBJ_UPDATE,
        data
    }
}

//学科更新

const subjectUpdateActions = (data) =>{

    return {

        type: COMMON_SUBJECT_INFO_UPDATE,

        data

    };

};

const appLoadingShow = (dispatch) =>{

    return {type:APP_LOADING_SHOW};

};

const appLoadingHide = (dispatch) =>{

    return {type:APP_LOADING_HIDE};

};

export default {

    USER_INFO_UPDATE,
    
    IDENTITY_CODE_OBJ_UPDATE,

    MODULE_INFO_UPDATE,

    COMMON_SUBJECT_INFO_UPDATE,

    SHOW_ERROR_ALERT,

    CLOSE_ERROR_ALERT,

    APP_LOADING_SHOW,

    APP_LOADING_HIDE,

    updateUserInfo,

    updateIdentityCodeObj,

    moduleInfoUpdate,

    subjectUpdateActions,

    showErrorAlert,

    showWarnAlert,

    showSuccessAlert,

    showQueryAlert,

    hideAlert,

    appLoadingShow,

    appLoadingHide,
}