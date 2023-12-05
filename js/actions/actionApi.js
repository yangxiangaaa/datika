import config from '../../../common/js/config';

import { getGetData, getPostData, } from './utils';
import md5 from '../../../common/js/md5';

import commonSettingActions from './commonSettingActions';


let PaperGradeProxy = config.WebRootUrl;

//获取答题卡详情
export const GetSheetDetail = async ({SheetID, dispatch}) => {
    let url = `${PaperGradeProxy}/api/AnswerSheet/GetSheetDetail?SheetID=${SheetID}`;

    const res = await getGetData(url, 2, '');

    if (res.ReturnCode === 200 && res.ResultCode ==0) {

        return res.Data;

    } else if (res.ReturnCode == 200 && res.ResultCode !==0) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });
        return false;
    }
}

//新建答题卡
export const AddSheet =  async ({ SheetName, SubjectID, SubjectName, GradeID, GlobalGrade, GradeName, TicketNOLength, SheetLayout, TicketNOProvideType, IsIncludeAB, QuesSortType, QuesCoord, QuesStruct, SheetImage='', CreatorID, CreatorName, CreatorIdentity,CreateType=1, Term, SchoolID, dispatch }) => {

    let url = `${PaperGradeProxy}/api/AnswerSheet/AddSheet`;

    let SecCode = md5(`${SheetName}${SubjectID}${SubjectName}${GradeID}${GlobalGrade}${GradeName}${TicketNOLength}${SheetLayout}${TicketNOProvideType}${IsIncludeAB}${QuesSortType}${QuesCoord}${QuesStruct}${SheetImage}${CreatorID}${CreatorName}${CreatorIdentity}${CreateType}${Term}${SchoolID}`, 1);

    let data = {
        SheetName,
        SubjectID,
        SubjectName,
        GradeID,
        GlobalGrade,
        GradeName,
        TicketNOLength,
        SheetLayout,
        TicketNOProvideType,
        IsIncludeAB,
        QuesSortType,
        QuesCoord,
        QuesStruct,
        SheetImage,
        CreatorID,
        CreatorName,
        CreatorIdentity,
        CreateType,
        Term,
        SchoolID,
        SecCode
    }

    const res = await getPostData(url, data, 2, '');

    if (res.ReturnCode === 200 && res.ResultCode ==0) {

        return res;

    } else if (res.ReturnCode == 200 && res.ResultCode !==0) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });
        return false;
    }
}

//保存在智能组卷系统中生成的答题卡
export const SaveSheetInPaperMakeSystem =  async ({ SheetName, UseType, SubjectID, SubjectName, GradeID, GlobalGrade, GradeName, TicketNOLength, SheetLayout, QuesCoord, QuesStruct, CreatorID, CreatorName, CreatorIdentity, Term, SchoolID, dispatch }) => {

    let url = `${PaperGradeProxy}/api/AnswerSheet/SaveSheetInPaperMakeSystem`;

    let SecCode = md5(`${SheetName}${UseType}${SubjectID}${SubjectName}${GradeID}${GlobalGrade}${GradeName}${TicketNOLength}${SheetLayout}${QuesCoord}${QuesStruct}${CreatorID}${CreatorName}${CreatorIdentity}${Term}${SchoolID}`, 1);

    let data = {
        SheetName,
        UseType,
        SubjectID,
        SubjectName,
        GradeID,
        GlobalGrade,
        GradeName,
        TicketNOLength,
        SheetLayout,
        QuesCoord,
        QuesStruct,
        CreatorID,
        CreatorName,
        CreatorIdentity,
        Term,
        SchoolID,
        SecCode
    }

    const res = await getPostData(url, data, 2, '');

    if (res.ReturnCode === 200 && res.ResultCode ==0) {

        return res;

    } else if (res.ReturnCode == 200 && res.ResultCode ==2) {

        return res;

    } else if (res.ReturnCode == 200 && res.ResultCode !==0) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });
        return false;
    }
}

//编辑答题卡
export const EditSheet =  async ({ SheetID, UserID, SheetName, SubjectID, SubjectName, GradeID, GlobalGrade, GradeName, TicketNOLength, SheetLayout, TicketNOProvideType, IsIncludeAB, QuesSortType, QuesCoord, QuesStruct, SheetImage='', dispatch }) => {

    let url = `${PaperGradeProxy}/api/AnswerSheet/EditSheet`;

    let SecCode = md5(`${SheetID}${UserID}${SheetName}${SubjectID}${SubjectName}${GradeID}${GlobalGrade}${GradeName}${TicketNOLength}${SheetLayout}${TicketNOProvideType}${IsIncludeAB}${QuesSortType}${QuesCoord}${QuesStruct}${SheetImage}`, 1);

    let data = {
        SheetID,
        UserID,
        SheetName,
        SubjectID,
        SubjectName,
        GradeID,
        GlobalGrade,
        GradeName,
        TicketNOLength,
        SheetLayout,
        TicketNOProvideType,
        IsIncludeAB,
        QuesSortType,
        QuesCoord,
        QuesStruct,
        SheetImage,
        SecCode
    }

    const res = await getPostData(url, data, 2, '');

    if (res.ReturnCode === 200 && res.ResultCode ==0) {

        return res;

    } else if (res.ReturnCode == 200 && res.ResultCode !==0) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });
        return false;
    }
}

//更新在智能组卷系统中生成的答题卡信息
export const UpdateSheetInPaperMakeSystem =  async ({ SheetID, UserID, SheetName, SubjectID, SubjectName, GradeID, GlobalGrade, GradeName, TicketNOLength, SheetLayout, QuesCoord, QuesStruct, dispatch }) => {

    let url = `${PaperGradeProxy}/api/AnswerSheet/UpdateSheetInPaperMakeSystem`;

    let SecCode = md5(`${SheetID}${UserID}${SheetName}${SubjectID}${SubjectName}${GradeID}${GlobalGrade}${GradeName}${TicketNOLength}${SheetLayout}${QuesCoord}${QuesStruct}`, 1);

    let data = {
        SheetID,
        UserID,
        SheetName,
        SubjectID,
        SubjectName,
        GradeID,
        GlobalGrade,
        GradeName,
        TicketNOLength,
        SheetLayout,
        QuesCoord,
        QuesStruct,
        SecCode
    }

    const res = await getPostData(url, data, 2, '');

    if (res.ReturnCode === 200 && res.ResultCode ==0) {

        return res;

    } else if (res.ReturnCode == 200 && res.ResultCode ==2) {

        return res;
        
    }  else if (res.ReturnCode == 200 && res.ResultCode !==0) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });
        return false;
    }
}

//获取学科信息
export const GetSchoolSubjectInfo = async ({BaseUrl='', schoolID='', gradeID='', userID='', dispatch}) => {
    const { BasicWebServerUrl } = localStorage.getItem("PapergradebaseInfo") ? JSON.parse(localStorage.getItem("PapergradebaseInfo")) : {};

    const res = await getGetData(`${BaseUrl ? BaseUrl : BasicWebServerUrl}/BaseApi/UserMgr/TeachInfoMgr/GetSchoolSubjectInfo?appid=361&access_token=f99aa59b30e5fb16507c745300e02725&schoolID=${schoolID}&gradeID=${gradeID}&userID=${userID}`, 2, '');

    if (res.StatusCode === 200) {

        return res.Data;

    } else if (res.StatusCode === 400) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });

    }
}

//获取课程(大小学通用)
export const GetCourseInfo = async ({BaseUrl='',  schoolID='', subjectID='', courseNO='', courseName='', updateTime='', userID='', globalGrade='', collegeID='', majorID='', dispatch}) => {
    const { BasicWebServerUrl } = localStorage.getItem("PapergradebaseInfo") ? JSON.parse(localStorage.getItem("PapergradebaseInfo")) : {};

    const res = await getGetData(`${BaseUrl ? BaseUrl : BasicWebServerUrl}/BaseApi/UserMgr/TeachInfoMgr/GetCourseInfo?appid=361&access_token=f99aa59b30e5fb16507c745300e02725&schoolID=${schoolID}&subjectID=${subjectID}&courseNO=${courseNO}&courseName=${courseName}&updateTime=${updateTime}&userID=${userID}&globalGrade=${globalGrade}&collegeID=${collegeID}&majorID=${majorID}`, 2, '');

    if (res.StatusCode === 200) {

        return res.Data;

    } else if (res.StatusCode === 400) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });

    }
}

//从基础平台获取年级列表(中小学)
export const GetGrade = async ({BaseUrl='', gradeID='', schoolID, dispatch}) => {
    const { BasicWebServerUrl } = localStorage.getItem("PapergradebaseInfo") ? JSON.parse(localStorage.getItem("PapergradebaseInfo")) : {};

    const res = await getGetData(`${BaseUrl ? BaseUrl : BasicWebServerUrl}/BaseApi/UserMgr/UserInfoMgr/GetGrade?appid=361&access_token=f99aa59b30e5fb16507c745300e02725&gradeID=${gradeID}&schoolID=${schoolID}`, 2, '');

    if (res.StatusCode === 200) {

        return res.Data;

    } else if (res.StatusCode === 400) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });

    }
}

//从基础平台获取年级列表(大学)
export const GetGrade_Univ = async ({BaseUrl='', gradeID='', schoolID, dispatch}) => {
    const { BasicWebServerUrl } = localStorage.getItem("PapergradebaseInfo") ? JSON.parse(localStorage.getItem("PapergradebaseInfo")) : {};

    const res = await getGetData(`${BaseUrl ? BaseUrl : BasicWebServerUrl}/BaseApi/UserMgr/UserInfoMgr/GetGrade_Univ?appid=361&access_token=f99aa59b30e5fb16507c745300e02725&gradeID=${gradeID}&schoolID=${schoolID}`, 2, '');

    if (res.StatusCode === 200) {

        return res.Data;

    } else if (res.StatusCode === 400) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });

    }
}

//获取学期
export const GetTermAndPeriodAndWeekNOInfo = async ( {BaseUrl='', UserID, SchoolID, UserType} ,dispatch ) => {
    const { BasicWebServerUrl } = localStorage.getItem("PapergradebaseInfo") ? JSON.parse(localStorage.getItem("PapergradebaseInfo")) : {};
    const res = await getGetData(`${BaseUrl ? BaseUrl : BasicWebServerUrl}/BaseApi/UserMgr/TeachInfoMgr/GetTermAndPeriodAndWeekNOInfo?appid=361&access_token=f99aa59b30e5fb16507c745300e02725&userID=${UserID}&schoolID=${SchoolID}&userType=${UserType}`, 2, '');

    if (res.StatusCode === 200) {

        return res.Data;

    } else if (res.StatusCode === 400) {

        commonSettingActions.showErrorAlert(dispatch,{ type: 'btn-error', title: res.ResultCode_Msg ? res.ResultCode_Msg : '未知错误' });

    }

};