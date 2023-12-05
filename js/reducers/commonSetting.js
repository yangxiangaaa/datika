import commonSettingActions from '../actions/commonSettingActions';

const defaultState = {

    module:{

        cnname:'',

        enname:'',

        productModuleName:'',

        image: '',

        className:'hidden-header',

        topRight:'',
        
        banner:false,

        bannerRightBtn:'',

        bannerLeftType:'',

        bannerContent:'',
    },

    subject:{

        SubjectID:'',

        SubjectName:''

    },

    alert:{

        type:'btn-warn',

        show:false,

        title:'',
        abstract:'',
        ok:null,

        cancel:null,

        okTitle:'确定',

        cancelTitle:"取消",

        close:null,

        cancelShow:'y',

        okShow:'y',

        hide:null

    },

    appLoading: true,

    userInfo:{},

    IdentityCodeObj: {
        IconUrl: '',
        IdentityCode: '',
        IdentityName: '',
        UserID: '',
        IsPreset: ''
    },

};


function commonSetting (state = defaultState, action) {
    switch (action.type) {
        case commonSettingActions.USER_INFO_UPDATE:
            return { ...state, userInfo:action.data};

        case commonSettingActions.IDENTITY_CODE_OBJ_UPDATE:
            return { ...state, IdentityCodeObj:action.data}

        case commonSettingActions.MODULE_INFO_UPDATE:
            return { ...state, module:{...state.module,...action.data}};

        case commonSettingActions.COMMON_SUBJECT_INFO_UPDATE:
            return { ...state, subject:action.data};

        case commonSettingActions.APP_LOADING_SHOW:

            return { ...state,appLoading:true};

        case commonSettingActions.APP_LOADING_HIDE:

            return { ...state,appLoading:false};

        case commonSettingActions.SHOW_ERROR_ALERT:

            return { ...state,alert:{...state.alert,show:true,...action.data}};

        case commonSettingActions.CLOSE_ERROR_ALERT:

            return { ...state,alert:{...state.alert,show:false}};

        default:
            return state;
    }
}

export default commonSetting