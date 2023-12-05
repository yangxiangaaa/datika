// @ts-nocheck

import React, { Component, useEffect, useState, useMemo, useReducer, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Modal, Alert, Empty, Loading, DropDown } from "../../../common/index";
import { Input, Button, Switch, Radio, Checkbox, Tooltip } from "antd";
import Scrollbars from 'react-custom-scrollbars';

import config from '../../../common/js/config';
import { getQueryVariable } from "../../../common/js/disconnect";
import commonSettingActions from "../actions/commonSettingActions";
import { useStateValue } from "../../../common/js/hooks";
import {
    testData,
    getOneMmsPx,
    numberToChinese,
    filterArrByGroup,
    QuestionTypeTextMap,
    QuestionTypeMap,
    QuestionTypeMap2,
    PositionObjTemplate,
    flatten
} from "../util";
import {
    restructData,
    getPageData,
    getQuestionScoreDesc,
    renderQuestion
} from '../questionRenderMethod';
import {
    AddSheet,
    EditSheet,
    GetSheetDetail,
    GetSchoolSubjectInfo,
    GetGrade,
    GetGrade_Univ,
    GetTermAndPeriodAndWeekNOInfo,
    GetCourseInfo
} from "../actions/actionApi";

import "../../scss/index.scss";
const BYTES_PER_SLICE = 1048576;

function RootContainer(props) {

    const dispatch = useDispatch();

    const { userInfo } = useSelector((state) => state.commonSetting);

    //答案及分数设置的滚动容器及内层div的Ref
    const ScoreScrollRef = useRef();
    const ScoreWrapperRef = useRef();

    const [loading, setLoading] = useState(false);

    //菜单tab栏
    const [tabIndex, setTabIndex] = useState(0);

    //学科
    const [dropList_1, setDropList_1] = useState([{ title: '不限', value: '' }]);
    const [dropSelect_1, setDropSelect_1] = useState({ title: '不限', value: '' });
    //年级
    const [dropList_2, setDropList_2] = useState([{ title: '不限', value: '' }]);
    const [dropSelect_2, setDropSelect_2] = useState({ title: '不限', value: '' });

    //题目类型
    const quesTypeDropList = [
        { title: '单选题', value: 'Single' },
        { title: '多选题', value: 'Multiple' },
        { title: '判断题', value: 'Judgment' },
        { title: '填空题', value: 'Completion' },
        { title: '解答题', value: 'Answer' },
        { title: '作文题', value: 'Article' },
        { title: '选做题', value: 'OptionalQues' },
        { title: '其它题型', value: 'Other' },
    ]
    //添加题目选择的类型
    const [selQuestionType, setSelQuestionType] = useState(quesTypeDropList[0]);

    //当前学期
    const [curTerm, setCurTerm] = useState('');

    const initForm = {
        SheetID: '',
        Title: '',
        SheetLayout: 1,    //答题卡布局栏数
        AdmissionNoLength: 6,  //准考证号长度（6~12）
        QuesSortType: 2, //客观题排序方式（1：竖排，2：横排）
        IsIncludeAB: 0,   //存在A、B卷
        TicketNOProvideType: '1',   //考号类型（1:手工填涂，2:条形码，3：二维码）
        questionListData: []
    }

    //答题卡表单
    const [form, dispatchForm] = useReducer((state, action) => {
        switch (action.type) {
            case 'setForm':
                return { ...state, ...action.data };
            default:
                return { ...state };
        }
    }, initForm)
    const formRef = useStateValue(form);

    const questionInitForm = {
        type: "",
        title: '',
        startIndex: 1,
        endIndex: '',
        showNum: 5,
        optionNum: 4,
        list: [],
        score: 0,
        ScoreRule: '',
        AnswerModel: '',
        QuesGroupExtraParam: '',
    }

    //题目设置表单
    const [questionForm, dispatchQuestionForm] = useReducer((state, action) => {
        switch (action.type) {
            case 'setForm':
                return { ...state, ...action.data };
            default:
                return { ...state };
        }
    }, questionInitForm)
    const questionFormRef = useStateValue(questionForm);

    //准考证号位数
    const [inputValue_2, setinputValue_2] = useState('');
    const useInputValue_2 = useStateValue(inputValue_2);

    //准考证号位数设置弹窗状态
    const [modalShow_1, setModalShow_1] = useState(false);

    //是否需要页脚
    const [hasFooter, setHasFooter] = useState(true);

    //题目答案、分数进度设置浮层显示
    const [progressTipShow, setProgressTipShow] = useState(false);

    //添加、修改题目弹窗配置
    const [modalConfig, setModalConfig] = useState({
        title: '',
        modalShow: false,
        data: {},
        onOk: () => { },
        onCancel: () => { },
    })
    const modalConfigRef = useStateValue(modalConfig);

    //(批量设置弹窗)分数输入框
    const [scoreValue, setScoreValue] = useState('');
    const scoreValueRef = useStateValue(scoreValue);
    //(批量设置弹窗)答案输入框
    const [answerInputMap, setAnswerInputMap] = useState([]);
    const answerInputMapRef = useStateValue(answerInputMap);
    //批量设置分数弹窗配置
    const [modalConfig2, setModalConfig2] = useState({
        title: '',
        modalShow: false,
        bodyHeight: '420px',
        data: {
            questionIndex: 0,
            questionStartIndex: 0,
            questionTitle: '',
            questionLength: 0,
            questionType: '',
            questionObj: {}
        },
        onOk: () => { },
        onCancel: closeModal2,
    })
    const modalConfig2Ref = useStateValue(modalConfig2);

    //批量设置答案输入框检测
    const [answerInputValidate, setAnswerInputValidate] = useState({
        result: [],
        isPass: false
    })
    const answerInputValidateRef = useStateValue(answerInputValidate);
    useEffect(() => {
        if (!modalConfig2.modalShow) {
            setAnswerInputValidate({
                result: [],
                isPass: false
            })
        }
    }, [modalConfig2.modalShow])

    const closeModal2 = () => {
        setModalConfig2({
            ...modalConfig2,
            title: '',
            modalShow: false,
            data: {
                questionIndex: 0,
                questionStartIndex: 0,
                questionTitle: '',
                questionLength: 0,
                questionType: '',
                questionObj: {}
            },
        })
        setScoreValue('');
        setAnswerInputMap([]);
    }

    //已设置的分值之和
    const TotalScore = useMemo(() => {
        let total = 0;
        form.questionListData.forEach((data) => {
            data.list.forEach((item) => {
                if (item.children && item.children.length > 0) {
                    item.children.forEach((childItem) => {
                        total += parseFloat(childItem.score);
                    })
                } else {
                    total += parseFloat(item.score);
                }
            })
        })
        return total;
    }, [form])

    //点击完成，未设置分数的题目输入框变红标志
    const [redTipsShow, setRedTipsShow] = useState(false);

    //答案及分值设置进度列表
    const progressData = useMemo(() => {
        let unFinishNOList = [];
        let temp = form.questionListData.map((question) => {
            let progressList = question.list.map((item) => {
                let flag = true;
                if (question.type == 'Completion' && item.children && item.children.length > 0) {
                    item.children.forEach((child) => {
                        if (child.score == 0) {
                            flag = false;
                        }
                    })
                } else {
                    if (item.score == 0 || (item.answerValue == '' && question.type != 'Completion' && question.type != 'Answer' && question.type != 'OptionalQues' && question.type != 'Other' && question.type != 'Article')) {
                        flag = false;
                    }
                }
                if (!flag) {
                    unFinishNOList.push(item.QuesNO);
                }
                return {
                    isFinish: flag,
                    QuesNO: item.QuesNO
                };
            })
            return {
                title: question.title,
                progressList
            }
        })
        return {
            progressInfo: temp,
            unFinishNOList
        };
    }, [form])

    //当前所有题目的小题总长度
    const quesLength = useMemo(() => {
        let len = 0;
        form.questionListData.forEach((item) => {
            item.list.forEach((_item) => {
                len++;
            })
            if (item.type == 'Comprehensive') {
                item.childQuesGroupList.forEach((childItem) => {
                    childItem.list.forEach((_item) => {
                        len++;
                    })
                })
            }
        })
        return len;
    }, [form.questionListData])

    //提示弹窗配置信息
    const [alertConfig, setAlertConfig] = useState({
        type: '',
        alertShow: false,
        title: '',
        onCancel: alertHide,
        onOk: alertHide,
        onHide: alertHide
    })
    const [UpdataImage, setUpdataImage] = useState(false);
    const UpdataImageRef = useStateValue(UpdataImage);
    //每页的展示数据
    const [showPageDataList, setshowPageDataList] = useState([]);
    const showPageDataListRef = useStateValue(showPageDataList);
    // const showPageDataList = useMemo(() => {

    //     return pageDataList;
    // }, [form])

    useEffect(() => {
        if (userInfo.UserID) {
            pageInit();
        }
    }, [userInfo])
    useEffect(() => {
        let dataList = form.questionListData.map((item, index) => {
            return {
                ...item,
                rowGroupList: restructData(item, item.type, form.SheetLayout, form.QuesSortType),
                NO: index + 1,
                showTitle: item.title + getQuestionScoreDesc(item),
                childQuesGroupList: item.childQuesGroupList ? item.childQuesGroupList.map((childItem) => {
                    return {
                        ...childItem,
                        rowGroupList: restructData(childItem, childItem.type, form.SheetLayout, form.QuesSortType),
                    }
                }) : []
            }
        })
        let pageDataList = [[]];
        let headerHeight = form.TicketNOProvideType.includes('1') && (form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3')) ? 470 : 405;
        if (form.questionListData.length > 0) {
            pageDataList = getPageData(dataList, 0, false, form.QuesSortType, headerHeight).pageDataList;
        }
        if (QuesStructRef.current) {
            QuesStructRef.current.map((item) => {
                item.QuesList.map((it) => {
                    if (it.AnswerImage) {
                        let isChoose = false;
                        pageDataList.map((item3) => {
                            item3.map((item4) => {
                                if (item4.NO === item.QuesGroupNO) {
                                    item4.list.map((item5) => {
                                        if (item5.QuesNO * 1 === it.QuesNO * 1 && ((it.AnswerImage.ImagePageIndex === 1 && !item5.hiddenNo) || (it.AnswerImage.ImagePageIndex !== 1 && item5.hiddenNo)) && !isChoose) {
                                            item5.AnswerImage = JSON.parse(JSON.stringify(it.AnswerImage));
                                            isChoose = true;
                                        }
                                    })
                                }
                            })
                        })
                    }
                })
            })

            setQuesStruct([]);
        }

        showPageDataListRef.current.map((item, index) => {
            item.map((item1, idx) => {
                item1.list.map((item2, id) => {
                    if (item2.AnswerImage) {
                        let isChoose = false;
                        pageDataList.map((item3) => {
                            item3.map((item4) => {
                                if (item4.NO === item1.NO) {
                                    item4.list.map((item5) => {
                                        if (item5.QuesNO === item2.QuesNO && item5.hiddenNo === item2.hiddenNo && !isChoose) {
                                            item5.AnswerImage = item2.AnswerImage;
                                            isChoose = true;
                                        }
                                    })
                                }
                            })
                        })
                    }
                })
            })
        })
        setshowPageDataList(pageDataList);
    }, [form])

    const pageInit = async () => {
        let res1;
        //获取学科列表
        if (userInfo.ISUniversity == 1) {
            res1 = await GetCourseInfo({
                schoolID: userInfo.SchoolID,
            });
        } else {
            res1 = await GetSchoolSubjectInfo({
                schoolID: userInfo.SchoolID,
            });
        }
        let subjectList = [];
        if (res1) {
            subjectList = res1.map((item) => {
                return {
                    title: item.CourseName ? item.CourseName : item.SubjectName,
                    value: item.CourseNO ? item.CourseNO : item.SubjectID
                }
            })
            let keyMap = [];
            subjectList.filter((item) => {
                let flag = true;
                if (keyMap.includes(item.value)) {
                    flag = false;
                } else {
                    keyMap.push(item.value);
                }
                return flag;
            })
            // subjectList.unshift({title:'不限',value:''});
            setDropList_1(subjectList);
            setDropSelect_1(subjectList[0]);
        }
        //获取年级列表
        let res2;
        let gradeList = [];
        if (userInfo.ISUniversity == 1) {
            res2 = await GetGrade_Univ({
                schoolID: userInfo.SchoolID
            })
        } else {
            res2 = await GetGrade({
                schoolID: userInfo.SchoolID
            })
        }
        if (res2) {
            gradeList = res2.map((item) => {
                return {
                    title: item.GradeName,
                    value: {
                        GradeID: item.GradeID,
                        GlobalGrade: item.GlobalGrade
                    }
                }
            })
            // gradeList.unshift({title:'不限',value:{GradeID:'',GlobalGrade:''}});
            setDropList_2(gradeList);
            setDropSelect_2(gradeList[0]);
        }
        //获取学期
        const res3 = await GetTermAndPeriodAndWeekNOInfo({
            UserID: userInfo.UserID,
            SchoolID: userInfo.SchoolID,
            UserType: userInfo.UserType
        }, dispatch)
        if (res3) {
            setCurTerm(res3.ItemTerm.Term);
        }
        if (getQueryVariable('type') == '1' || getQueryVariable('type') == '2' || getQueryVariable('type') == '5') {
            let subjectid = getQueryVariable('subjectid');
            let gradeid = getQueryVariable('gradeid');
            if (subjectid) {
                let selSubject = subjectList.find(item => item.value == subjectid);
                if (selSubject) {
                    setDropSelect_1(selSubject);
                }
            }
            if (gradeid) {
                let selGradeid = gradeList.find(item => item.value.GradeID == gradeid);
                if (selGradeid) {
                    setDropSelect_2(selGradeid);
                }
            }
        }
        //获取答题卡信息
        if (getQueryVariable('sheetid')) {
            setLoading(true);
            let res = await GetSheetDetail({
                SheetID: getQueryVariable('sheetid')
            })
            if (res) {
                let selSubject = subjectList.find(item => item.value == res.SubjectID);
                if (selSubject) {
                    setDropSelect_1(selSubject);
                }
                let selGrade = gradeList.find(item => item.value.GradeID == res.GradeID);
                if (selGrade) {
                    setDropSelect_2(selGrade);
                }
                setQuesStruct(res.QuesStruct);
                let questionListData = res.QuesStruct.map((question) => {
                    return {
                        type: QuestionTypeMap2[question.QuesGroupType],
                        title: question.QuesGroupName,
                        showNum: question.LayoutParam,
                        ScoreRule: question.ScoreRule,
                        AnswerModel: question.AnswerModel,
                        QuesGroupExtraParam: question.QuesGroupExtraParam,
                        list: question.QuesList.map((item) => {
                            return {
                                QuesNO: item.QuesNO,
                                score: item.QuesScore,
                                answerValue: '',
                                QuesExtraParam: item.QuesExtraParam,
                                optionNum: item.NodeCount || item.AnswerHeight,
                            }
                        }),
                        startIndex: question.QuesList[0].QuesNO,
                        endIndex: question.QuesList[question.QuesList.length - 1].QuesNO,
                    }
                })
                dispatchForm({
                    type: 'setForm',
                    data: {
                        SheetID: getQueryVariable('type') === '2' ? res.SheetID : '',
                        Title: res.SheetName,
                        SheetLayout: res.SheetLayout,    //答题卡布局栏数
                        AdmissionNoLength: res.TicketNOLength,  //准考证号长度（6~12）
                        TicketNOProvideType: res.TicketNOProvideType,
                        IsIncludeAB: res.IsIncludeAB,
                        QuesSortType: res.QuesSortType,
                        questionListData
                    }
                })
            }
        }
        setLoading(false);
        dispatch(commonSettingActions.appLoadingHide());
    }
    const [QuesStruct, setQuesStruct] = useState([]);
    const QuesStructRef = useStateValue(QuesStruct);
    //学科设置
    const dropChange_1 = (item) => {
        setDropSelect_1(item);
    }

    //年级设置
    const dropChange_2 = (item) => {
        setDropSelect_2(item);
    }

    //答题卡名称
    const inputRef_1 = useRef();
    const inputChange_1 = (e) => {
        if (e.target.value.length > 30) {
            return;
        }
        dispatchForm({
            type: 'setForm',
            data: {
                Title: e.target.value
            }
        })
    }
    const inputBlur_1 = (e) => {
        let reg = /[@\$￥\^&,，。\.;；\*\|]+/;
        if (reg.test(e.target.value)) {
            showAlert({
                title: '答题卡名称不能包含@￥$^&,，。.;；*|等字符',
                type: 'btn-tips',
                alertShow: true,
                ok: () => {
                    inputRef_1.current.focus();
                },
                onCancel: () => {
                    alertHide();
                    inputRef_1.current.focus();
                },
                onHide: () => {
                    alertHide();
                    inputRef_1.current.focus();
                }
            })
        }
    }

    //准考证位数
    const inputChange_2 = (e) => {
        if (e.target.value.length > 2) {
            return;
        }
        setinputValue_2(e.target.value);
    }

    //题目名称
    const inputRef_3 = useRef();
    const inputChange_3 = (e) => {
        if (e.target.value.length > 30) {
            return;
        }
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                title: e.target.value
            }
        })
    }
    const inputBlur_3 = (e) => {
        let reg = /^[\s\[\]\(\)a-zA-Z0-9_、\(\)\u0391-\uFFE5]+$/
        if (!reg.test(e.target.value) && e.target.value != '') {
            showAlert({
                title: '题目名称只能包含中文、英文、数字、_ () 、 []',
                type: 'btn-tips',
                alertShow: true,
                ok: () => {
                    inputRef_3.current.focus();
                },
                onCancel: () => {
                    alertHide();
                    inputRef_3.current.focus();
                },
                onHide: () => {
                    alertHide();
                    inputRef_3.current.focus();
                }
            })
        }
    }

    //题目起始下标
    const [inputValue_4, setInputValue_4] = useState('');
    const inputBlur_4 = (e) => {
        let value = parseInt(e.target.value);
        let listData = [];
        let startIndex = value;
        let endIndex = parseInt(questionFormRef.current.endIndex);
        if (value > parseInt(questionFormRef.current.endIndex)) {
            showAlert({
                title: '起始下标需小于等于终止下标',
                type: 'warn',
                alertShow: true
            })
            setInputValue_4(questionFormRef.current.startIndex)
            return;
        }
        for (let i = startIndex; i <= endIndex; i++) {
            listData.push({
                optionNum: questionFormRef.current.optionNum,
                answerValue: '',
                score: questionFormRef.current.score || 0,
                QuesNO: i,
                children: []
            })
        }
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                startIndex: e.target.value,
                list: listData
            }
        })
    }
    const inputChange_4 = (e) => {
        if (e.target.value.length > 3 || e.target.value < 0) {
            return;
        }
        let value = e.target.value;
        if (value <= 0) {
            showAlert({
                title: '起始下标需从1开始',
                type: 'warn',
                alertShow: true
            })
            return;
        }
        let startIndex = value;
        let endIndex = parseInt(questionFormRef.current.endIndex);
        if (endIndex - startIndex > 100) {
            showAlert({
                title: '最多不能超过100题',
                type: 'warn',
                alertShow: true
            })
            return;
        }
        setInputValue_4(value);
    }

    //题目终止下标
    const [inputValue_5, setInputValue_5] = useState('');
    const inputBlur_5 = (e) => {
        console.log(e, 123131);
        let value = parseInt(e.target.value);
        let listData = [];
        let startIndex = parseInt(questionFormRef.current.startIndex);
        let endIndex = value;
        if (value < parseInt(questionFormRef.current.startIndex)) {
            showAlert({
                title: '终止下标需大于等于起始下标',
                type: 'warn',
                alertShow: true
            })
            setInputValue_5(questionFormRef.current.endIndex)
            return;
        }
        let defaultOptionNumMap = {
            Single: 4,
            Multiple: 4,
            Judgment: 2,
            Completion: 1,
            Answer: 5
        }
        let defaultOptionNum = questionFormRef.current.list.length > 0 ? questionFormRef.current.list[0]['optionNum'] : defaultOptionNumMap[questionFormRef.current.type];
        for (let i = startIndex; i <= endIndex; i++) {
            listData.push({
                optionNum: questionFormRef.current.optionNum || defaultOptionNum,
                answerValue: '',
                score: questionFormRef.current.score || 0,
                QuesNO: i,
                children: []
            })
        }
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                endIndex: e.target.value,
                list: listData
            }
        })
    }
    const inputChange_5 = (e) => {
        if (e.target.value.length > 3 || e.target.value.includes('-')) {
            return;
        }
        let value = parseInt(e.target.value);
        if (value <= 0 || value == '') {
            showAlert({
                title: '终止下标需从1开始',
                type: 'warn',
                alertShow: true
            })
            return;
        }
        let startIndex = parseInt(questionFormRef.current.startIndex);
        if (value - startIndex > 100) {
            showAlert({
                title: '最多不能超过100题',
                type: 'warn',
                alertShow: true
            })
            return;
        }
        setInputValue_5(value);
    }

    //每组选项数(空格、行高)数
    const inputChange_6 = (e) => {
        if (e.target.value.length > 2) {
            return;
        }
        if (e.target.value.includes('-')) {
            return;
        }
        let value = parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1;
        if (value > 7 && modalConfigRef.current.data.type != 'Completion' && modalConfigRef.current.data.type != 'Answer' && modalConfigRef.current.data.type != 'Other' && modalConfigRef.current.data.type != 'OptionalQues') {
            let tipStr = parseInt(e.target.value) == 0 ? '选项数至少为1个' : '选项数不能超过7个';
            showAlert({
                title: tipStr,
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        if (value >= 100 && (modalConfigRef.current.data.type == 'Answer' || modalConfigRef.current.data.type == 'Other' || modalConfigRef.current.data.type == 'OptionalQues')) {
            showAlert({
                title: '每题高度最大不能超过100行',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                optionNum: e.target.value == '' ? 1 : value,
                list: questionFormRef.current.list.map((item) => {
                    return {
                        ...item,
                        optionNum: e.target.value == '' ? 1 : value,
                    }
                })
            }
        })
    }
    const inputChange_ScoreRule = (e) => {
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                ScoreRule: e.target.value == '' ? '' : e.target.value,
            }
        })
    }

    //作文行数
    const inputChange_7 = (e) => {
        if (e.target.value.length > 2) {
            return;
        }
        if (e.target.value.includes('-')) {
            return;
        }
        let value = parseInt(e.target.value);
        if (value <= 0 || value > 100) {
            showAlert({
                title: '行数需在1~100之间',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                optionNum: e.target.value == '' ? 1 : value,
                list: [{
                    ...questionFormRef.current.list[0],
                    optionNum: e.target.value == '' ? 1 : value,
                }]
            }
        })
    }

    //设置每道题的具体选项数、空格数、行高(选择题、多选题、填空题、解答题)
    const inputChange_8 = (e, index1, type, index2 = -1) => {
        if (e.target.value.length > 2) {
            return;
        }
        let temp = questionFormRef.current.list.slice();
        let value = parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1;
        if (index2 != -1) {
            temp[index1]['children'][index2]['optionNum'] = e.target.value == '' ? 1 : value;
        } else {
            if (value > 7 && type != 'Answer' && type != 'Completion' && type != 'Other' && type != 'OptionalQues') {
                showAlert({
                    title: '选项数不能超过7个',
                    alertShow: true,
                    type: 'warn'
                })
                return;
            }
            if (value >= 100 && (type == 'Answer' || type == 'Other' || type == 'OptionalQues')) {
                showAlert({
                    title: '每题高度最大不能超过100行',
                    alertShow: true,
                    type: 'warn'
                })
                return;
            }
            temp[index1]['optionNum'] = e.target.value == '' ? 1 : value;
        }
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                list: temp,
                optionNum: (type == 'Single' || type == 'Multiple' || type == 'Completion') && questionForm.optionNum == e.target.value ? questionForm.optionNum : ''
            }
        })
    }

    //每组题数(每行空格数)
    const inputChange_9 = (e, index, type) => {
        if (e.target.value.length > 2) {
            return;
        }
        if (e.target.value.includes('-')) {
            return;
        }
        let value = parseInt(e.target.value);
        if ((value <= 0 || value > 6) && type == 'Completion') {
            showAlert({
                title: '每行展示的空格数需在1~6之间',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        if ((value <= 0 || value > 20) && type != 'Completion' && type != 'Article') {
            showAlert({
                title: '每组题目数需在1~20之间',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        if ((value <= 0 || value > 15) && type != 'Completion' && type != 'Article' && form.QuesSortType == 1 && form.SheetLayout == 3) {
            showAlert({
                title: '每组题目数需在1~15之间',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        if ((value <= 0 || value > 100) && type == 'Article') {
            showAlert({
                title: '行数需在1~100之间',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        let temp = formRef.current.questionListData.slice();

        if (type == 'Article') {
            temp[index]['list'][0]['optionNum'] = value || 1;
        } else {
            temp[index]['showNum'] = value || 1;
        }
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
    }
    const inputChangeQuesExtraParam = (e, index, str, type, SheetLayout) => {
        let value = parseInt(e.target.value);
        let temp = formRef.current.questionListData.slice();
        if (type) {
            temp[index]['list'][0]['QuesExtraParam'] = value + '%' + str;
            let count = 20;
            if (SheetLayout) {
                if (SheetLayout === 3) {
                    count = 15;
                }
            } else {
                if (form.SheetLayout === 3) {
                    count = 15;
                }
            }
            console.log(SheetLayout, 62131231231);
            temp[index]['list'][0]['optionNum'] = Math.ceil(value / count) || 1;
            dispatchForm({
                type: 'setForm',
                data: {
                    questionListData: temp
                }
            })
        } else {
            temp[index]['list'][0]['QuesExtraParam'] = str + '%' + value;
        }


        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
    }
    //解答题行高修改
    const changeAnswerHeight = (e, quesGroupIndex, quesIndex, index) => {
        // console.log(quesIndex);
        let value = e.target.value;
        if (value.length > 2) {
            showAlert({
                title: '行数需在1~99之间',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        if (value < 1) {
            return;
        }
        let temp = formRef.current.questionListData.slice();
        // console.log(quesGroupIndex, quesIndex, 2312312);
        temp[quesGroupIndex]['list'][quesIndex === undefined ? index : quesIndex]['optionNum'] = value;
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
    }

    //展示弹窗
    const showAlert = (config) => {
        setAlertConfig(d => ({
            ...d,
            onCancel: alertHide,
            onOk: alertHide,
            onHide: alertHide,
            ...config
        }));

        let time = config.time ? config.time : 1000;
        if (config.type.indexOf('btn-') == -1) {
            let alertTimer = setTimeout(() => {
                setAlertConfig(d => ({ ...d, alertShow: false }));
            }, time)
        }
    }

    //隐藏弹窗
    const alertHide = () => {
        setAlertConfig(d => ({ ...d, alertShow: false }));
    }

    const showModal = (config) => {
        setModalConfig({
            ...config,
            onOk: config.onOk ? config.onOk : modalHide,
            onCancel: config.onCancel ? config.onCancel : modalHide
        })
    }

    const modalHide = () => {
        setModalConfig({
            modalShow: false,
            title: '',
            onOk: modalHide,
            onCancel: modalHide,
            data: {}
        })
        setSelQuestionType(quesTypeDropList[0]);
    }

    //确认设置准考证号长度
    const confirmSetLength = () => {
        let num = parseInt(useInputValue_2.current);
        if (num >= 6 && num <= 12) {
            dispatchForm({
                type: 'setForm',
                data: {
                    AdmissionNoLength: parseInt(useInputValue_2.current)
                }
            })
            setModalShow_1(false);
            setinputValue_2('');
        } else {
            showAlert({
                title: '请输入6~12之间的数字',
                alertShow: true,
                type: 'warn'
            })
        }
    }

    //分数答案设置渲染
    const renderQuestionOptions = (type, data, groupIndex = -1, index = -1) => {
        let optionNum = data.optionNum;
        let optionsArr = [
            { title: 'A', label: 'A', value: 'A' },
            { title: 'B', label: 'B', value: 'B' },
            { title: 'C', label: 'C', value: 'C' },
            { title: 'D', label: 'D', value: 'D' },
            { title: 'E', label: 'E', value: 'E' },
            { title: 'F', label: 'F', value: 'F' },
            { title: 'G', label: 'G', value: 'G' },
        ]
        switch (type) {
            case 'Single':
                return (
                    <div className="single-options">
                        <Radio.Group
                            options={optionsArr.slice(0, optionNum)}
                            value={data.answerValue}
                            onChange={(value) => { answerOptionChange(value, groupIndex, index) }}
                        >
                        </Radio.Group>
                    </div>
                )
            case 'Multiple':
                return (
                    <div className="multiple-options">
                        <Checkbox.Group
                            options={optionsArr.slice(0, optionNum)}
                            value={data.answerValue.split(',')}
                            onChange={(value) => { answerOptionChange(value, groupIndex, index) }}
                        ></Checkbox.Group>
                    </div>
                )
            case 'Judgment':
                return (
                    <div className="judgment-options">
                        <Radio.Group
                            options={[
                                { label: 'T', value: 'T' },
                                { label: 'F', value: 'F' }
                            ]}
                            value={data.answerValue}
                            onChange={(value) => { answerOptionChange(value, groupIndex, index) }}
                        >
                        </Radio.Group>
                    </div>
                )
            case 'Completion':
                return (
                    <div className="completion-options" style={data.children && data.children.length > 0 ? { width: '80px' } : {}}></div>
                )
            case 'Other':
            case 'OptionalQues':
            case 'Answer':
                return (
                    <div className="answer-options"></div>
                )
            case 'Article':
                return (
                    <div className="article-options"></div>
                )
        }
    }

    //切换菜单栏tab
    const toggleTab = (index) => {
        setTabIndex(index);
    }

    //答题添加(编辑)题目弹窗
    const showAddModal = (type, initData = '', editIndex = -1) => {
        let methodStr = initData ? 'edit' : 'add';
        let modalTitle = '';
        initData = JSON.parse(JSON.stringify(initData));
        if (initData && initData.list.length > 0) {

            let defaultOptionNum = initData.list.reduce((pre, cur) => {
                if (pre == cur.optionNum) {
                    return cur.optionNum;
                } else {
                    return false;
                }
            }, initData.list[0].optionNum)
            if (!defaultOptionNum) {
                defaultOptionNum = '';
            }

            let defaultScore = initData.list.reduce((pre, cur) => {
                if (pre == cur.score) {
                    return cur.score;
                } else {
                    return false;
                }
            }, initData.list[0].score)
            if (!defaultScore) {
                defaultScore = initData.score;
            }

            initData = {
                ...initData,
                optionNum: type == 'Answer' || type == 'Other' || type == 'OptionalQues' || type == 'Article' ? initData.list[0]['optionNum'] : defaultOptionNum,
                startIndex: initData.list[0]['QuesNO'],
                endIndex: initData.list[initData.list.length - 1]['QuesNO'],
                score: defaultScore
            }
            setInputValue_4(initData.list[0]['QuesNO'])
            setInputValue_5(initData.list[initData.list.length - 1]['QuesNO'])
        } else {
            let startIndex = initData ? initData.startIndex : quesLength + 1;
            setInputValue_4(startIndex);
            setInputValue_5('');
        }
        switch (type) {
            case 'Single':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'Single',
                        title: '单选题',
                        startIndex: quesLength + 1,
                        endIndex: '',
                        showNum: 5,
                        optionNum: 4,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                })
                modalTitle = '单选题设置';
                break;
            case 'Judgment':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'Judgment',
                        title: '判断题',
                        startIndex: quesLength + 1,
                        endIndex: '',
                        showNum: 5,
                        optionNum: 2,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '2',
                    }
                })
                modalTitle = '判断题设置';
                break;
            case 'Multiple':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'Multiple',
                        title: '多选题',
                        startIndex: quesLength + 1,
                        endIndex: '',
                        showNum: 5,
                        optionNum: 4,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                })
                modalTitle = '多选题设置';
                break;
            case 'Completion':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'Completion',
                        title: '填空题',
                        startIndex: quesLength + 1,
                        endIndex: '',
                        showNum: 2,
                        optionNum: 1,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                })
                modalTitle = '填空题设置';
                break;
            case 'Answer':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'Answer',
                        title: '解答题',
                        startIndex: quesLength + 1,
                        endIndex: '',
                        showNum: 1,
                        optionNum: 8,
                        list: [],
                        score: 10,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                })
                modalTitle = '解答题设置';
                break;
            case 'Other':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'Other',
                        title: '其它题型',
                        startIndex: quesLength + 1,
                        endIndex: '',
                        showNum: 1,
                        optionNum: 8,
                        list: [],
                        score: 10,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                })
                modalTitle = '其它题型设置';
                break;
            case 'OptionalQues':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'OptionalQues',
                        title: '选做题',
                        startIndex: quesLength + 1,
                        endIndex: quesLength + 1,
                        showNum: 1,
                        optionNum: 8,
                        list: [],
                        score: 10,
                        ScoreRule: '',
                        AnswerModel: '2%1',
                        QuesGroupExtraParam: '',
                    }
                })
                modalTitle = '选做题设置';
                setTimeout(() => {
                    inputBlur_5({ target: { value: initData ? quesLength : quesLength + 1 } })
                }, 150)
                break;
            case 'Article':
                dispatchQuestionForm({
                    type: 'setForm',
                    data: initData ? initData : {
                        type: 'Article',
                        title: '作文题',
                        startIndex: quesLength + 1,
                        endIndex: quesLength + 1,
                        showNum: 1,
                        optionNum: 10,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                        list: [{
                            optionNum: 10,   //行数
                            score: 30,        //分值
                            answerValue: "",      //答案值(多个值时以|分隔)
                            QuesNO: quesLength + 1,
                            QuesExtraParam: '200%100',
                        }]
                    }
                })
                modalTitle = '作文题设置';
                break;
        }
        if (methodStr == 'add') {
            modalTitle = '添加试题';
        }
        setSelQuestionType(quesTypeDropList.find(item => item.value == type));
        showModal({
            title: modalTitle,
            modalShow: true,
            data: {
                type,
                methodStr,
                editIndex
            },
            onOk: () => {
                confirmAddOrEditQuestion(methodStr, editIndex);
            }
        })
    }

    //切换题目类型
    const toggleQuestionType = (item) => {
        setSelQuestionType(item);
        if (modalConfigRef.current.data.methodStr == 'add') {
            showAddModal(item.value);
        } else {
            let editIndex = modalConfigRef.current.data.editIndex;
            let startIndex = formRef.current.questionListData[editIndex]['list'][0]['QuesNO'];
            let initData;
            switch (item.value) {
                case 'Single':
                    initData = {
                        type: 'Single',
                        title: '单选题',
                        startIndex,
                        endIndex: '',
                        showNum: 5,
                        optionNum: 4,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                    break;
                case 'Judgment':
                    initData = {
                        type: 'Judgment',
                        title: '判断题',
                        startIndex,
                        endIndex: '',
                        showNum: 5,
                        optionNum: 2,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '2',
                    }
                    break;
                case 'Multiple':
                    initData = {
                        type: 'Multiple',
                        title: '多选题',
                        startIndex,
                        endIndex: '',
                        showNum: 5,
                        optionNum: 4,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                    break;
                case 'Completion':
                    initData = {
                        type: 'Completion',
                        title: '填空题',
                        startIndex,
                        endIndex: '',
                        showNum: 2,
                        optionNum: 1,
                        list: [],
                        score: 2,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                    break;
                case 'Answer':
                    initData = {
                        type: 'Answer',
                        title: '解答题',
                        startIndex,
                        endIndex: '',
                        showNum: 1,
                        optionNum: 5,
                        list: [],
                        score: 10,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                    break;
                case 'Other':
                    initData = {
                        type: 'Other',
                        title: '其它题型',
                        startIndex,
                        endIndex: '',
                        showNum: 1,
                        optionNum: 5,
                        list: [],
                        score: 10,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                    }
                    break;
                case 'OptionalQues':
                    initData = {
                        type: 'OptionalQues',
                        title: '选做题',
                        startIndex,
                        endIndex: startIndex,
                        showNum: 1,
                        optionNum: 5,
                        list: [],
                        score: 10,
                        ScoreRule: '',
                        AnswerModel: '2%1',
                        QuesGroupExtraParam: '',
                    }
                    setTimeout(() => {
                        inputBlur_5({ target: { value: startIndex } })
                    }, 150)

                    break;
                case 'Article':
                    initData = {
                        type: 'Article',
                        title: '作文题',
                        startIndex,
                        endIndex: startIndex,
                        showNum: 1,
                        optionNum: 10,
                        ScoreRule: '',
                        AnswerModel: '',
                        QuesGroupExtraParam: '',
                        list: [{
                            optionNum: 10,   //行数
                            score: 30,        //分值
                            answerValue: "",      //答案值(多个值时以|分隔)
                            QuesNO: startIndex,
                            QuesExtraParam: '200%100',
                        }]
                    }
                    break;
            }
            showAddModal(item.value, initData, editIndex);

        }
    }

    //确认添加或设置题目
    const confirmAddOrEditQuestion = (methodStr, editIndex) => {
        if (checkForm()) {
            let tempData = form.questionListData.slice();
            if (methodStr == 'edit' && editIndex >= 0) {
                tempData.splice(editIndex, 1, {
                    ...questionFormRef.current,
                    type: modalConfigRef.current.data.type,
                })
                // let startIndex = 1;
                // tempData = tempData.map((item)=>{
                //     return {
                //         ...item,
                //         startIndex,
                //         endIndex: startIndex + item.list.length-1,
                //         list: item.list.map((ques)=>{
                //             return {
                //                 ...ques,
                //                 QuesNO: startIndex++
                //             }
                //         })
                //     }
                // })
            }
            if (methodStr == 'add') {
                tempData.push({
                    ...questionFormRef.current,
                    type: modalConfigRef.current.data.type,
                });
            }
            dispatchForm({
                type: 'setForm',
                data: {
                    questionListData: tempData
                }
            })
            modalHide();
        }
    }

    //表单校验
    const checkForm = () => {
        if (questionFormRef.current.title == '') {
            showAlert({
                title: '题目名称不能为空',
                alertShow: true,
                type: 'warn'
            })
            return false;
        }
        if (questionFormRef.current.startIndex == '') {
            showAlert({
                title: '题目起始下标不能为空',
                alertShow: true,
                type: 'warn'
            })
            return false;
        }
        if (questionFormRef.current.endIndex == '') {
            showAlert({
                title: '题目结束下标不能为空',
                alertShow: true,
                type: 'warn'
            })
            return false;
        }
        if (modalConfigRef.current.data.type == 'Completion') {
            if (questionFormRef.current.showNum == '') {
                showAlert({
                    title: '每行至少需要展示1个空',
                    alertShow: true,
                    type: 'warn'
                })
                return false;
            }
            if (questionFormRef.current.showNum > 6) {
                showAlert({
                    title: '每行最多展示6个空',
                    alertShow: true,
                    type: 'warn'
                })
                return false;
            }
        }
        return true;
    }

    //删除题目
    const deleteQuestion = (index) => {
        showAlert({
            title: <div>是否确认删除题目<span className="delete-file-tip-style" title={form.questionListData[index]['title']}> {form.questionListData[index]['title']} </span>？</div>,
            type: 'btn-query',
            alertShow: true,
            onOk: () => {
                let temp = form.questionListData.slice();
                temp.splice(index, 1);
                // let startIndex = 1;
                temp = temp.map((item) => {
                    return {
                        ...item,
                        // startIndex,
                        // endIndex: startIndex + item.list.length - 1,
                        list: item.list.map((ques) => {
                            return {
                                ...ques,
                                // QuesNO: startIndex++
                            }
                        })
                    }
                })
                dispatchForm({
                    type: 'setForm',
                    data: {
                        questionListData: temp
                    }
                })
                alertHide();
            }
        })
    }

    //改变题目顺序
    const changeIndex = (type, index) => {
        let temp = formRef.current.questionListData.slice();
        switch (type) {
            case 'up':
                if (index == 0) {
                    return;
                }
                [temp[index], temp[index - 1]] = [temp[index - 1], temp[index]]
                break;
            case 'down':
                if (index == temp.length - 1) {
                    return;
                }
                [temp[index], temp[index + 1]] = [temp[index + 1], temp[index]]
                break;
        }
        // let startIndex = 1;
        // temp = temp.map((item)=>{
        //     return {
        //         ...item,
        //         startIndex,
        //         endIndex: startIndex + item.list.length-1,
        //         list: item.list.map((ques)=>{
        //             return {
        //                 ...ques,
        //                 QuesNO: startIndex++
        //             }
        //         })
        //     }
        // })
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
    }

    //右侧菜单栏题目分数设置
    // const questionScoreChange = (value, groupIndex, index, childIndex=-1) => {
    //     let temp = form.questionListData.slice();
    //     if(childIndex!=-1){
    //         temp[groupIndex]['list'][index]['children'][childIndex]['score'] = value;
    //     } else{
    //         temp[groupIndex]['list'][index]['score'] = value;
    //     }
    //     dispatchForm({
    //         type: 'setForm',
    //         data: {
    //             questionListData: temp
    //         }
    //     })
    // }

    //小题分数设置
    const questionScoreChange = (value, index) => {
        if (value == 0) {
            showAlert({
                title: '分数不能为0',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        let temp = questionFormRef.current.list.slice();
        temp[index]['score'] = value;
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                list: temp
            }
        })
    }

    const questionScoreChangeAll = (value) => {
        if (value == 0) {
            showAlert({
                title: '分数不能为0',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        let temp = questionFormRef.current.list.map((item) => {
            return {
                ...item,
                score: value
            }
        })
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                list: temp,
                score: value
            }
        })
    }

    //设置答案
    const answerOptionChange = (value, groupIndex, index) => {
        let temp = formRef.current.questionListData.slice();
        if (Array.isArray(value)) {
            temp[groupIndex]['list'][index]['answerValue'] = value.join(',');
        } else {
            temp[groupIndex]['list'][index]['answerValue'] = value.target.value;
        }
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
    }

    //添加填空题子项(题目弹窗设置)
    const addCompletionItem = (index) => {
        let temp = questionFormRef.current.list.slice();
        temp[index]['children'].push({
            optionNum: 1,
            score: 0
        })
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                list: temp
            }
        })
    }

    //删除填空题项(题目弹窗设置)
    const deleteCompletionItem = (index) => {
        let temp = questionFormRef.current.list.slice();
        temp.splice(index, 1);

        let endIndex = parseInt(questionFormRef.current.startIndex) + temp.length - 1;
        endIndex = endIndex > 0 && endIndex >= parseInt(questionFormRef.current.startIndex) ? endIndex : ''
        setInputValue_5(endIndex);
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                list: temp,
                endIndex
            }
        })
    }

    //删除填空题子项(题目弹窗设置)
    const deleteCompletionChildItem = (index1, index2) => {
        let temp = questionFormRef.current.list.slice();
        temp[index1]['children'].splice(index2, 1)
        dispatchQuestionForm({
            type: 'setForm',
            data: {
                list: temp
            }
        })
    }

    //点击批量设置
    const showAnswerSetupModal = (item, index) => {
        if (item.type == 'Completion' || item.type == 'Answer' || item.type == 'Other' || item.type == 'OptionalQues') {
            setScoreValue(0);
            setModalConfig2({
                ...modalConfig2,
                title: `${QuestionTypeTextMap[item.type]}批量设置分值`,
                bodyHeight: '160px',
                modalShow: true,
                data: {
                    questionIndex: index,
                    questionStartIndex: item.list.length > 0 ? item.list[0].QuesNO : 0,
                    questionTitle: QuestionTypeTextMap[item.type],
                    questionLength: item.list.length,
                    questionType: item.type,
                    questionObj: item,
                },
                onOk: setGroupScore,
                onCancel: closeModal2
            })
            return;
        }
        let strMap = [];
        filterArrByGroup(item.list, 5).map((quesGroup) => {
            if (item.type == 'Multiple') {
                let temp = quesGroup.map(q => q.answerValue.replace(/,/g, ''))
                let str = temp.filter((q, i) => {
                    if (q != '' || (q == '' && temp[i + 1])) {
                        return true
                    } else {
                        return false
                    }
                }).join('|');
                strMap.push(str);
            } else {
                strMap.push(quesGroup.map(q => q.answerValue).join(''));
            }
        })
        setAnswerInputMap(strMap);
        setScoreValue(0);
        setModalConfig2({
            ...modalConfig2,
            title: `${QuestionTypeTextMap[item.type]}批量设置答案及分值`,
            bodyHeight: `${170 + 42 * Math.ceil(item.list.length / 5) > 420 ? 420 : 170 + 42 * Math.ceil(item.list.length / 5)}px`,
            modalShow: true,
            data: {
                questionIndex: index,
                questionStartIndex: item.list.length > 0 ? item.list[0].QuesNO : 0,
                questionTitle: QuestionTypeTextMap[item.type],
                questionLength: item.list.length,
                questionType: item.type,
                questionObj: item,
            },
            onOk: setGroupScoreAndAnswer,
            onCancel: closeModal2
        })
        setTimeout(() => {
            answerInputBlur();
        })
    }

    //批量设置，题组输入框值改变
    const answerInputChange = (value, index) => {
        let strMap = answerInputMap.slice();
        strMap[index] = value;
        setAnswerInputMap(strMap);
    }

    //批量设置答案失去焦点后输入检测
    const answerInputBlur = () => {
        let inputReg;
        switch (modalConfig2Ref.current.data.questionType) {
            case 'Single':
                inputReg = /^[ABCDEFG]{5}$/;
                break;
            case 'Multiple':
                inputReg = /^[ABCDEFG]{1,7}((\|[ABCDEFG]{1,7}){4})$/;
                break;
            case 'Judgment':
                inputReg = /^[TF]{5}$/;
                break;
            default:
                inputReg = /./;
                break;
        }
        //1:填写正确 2:未填写 3:填写错误
        let lastGroupNum = modalConfig2Ref.current.data.questionLength % 5 == 0 ? 5 : modalConfig2Ref.current.data.questionLength % 5;
        let result = answerInputMapRef.current.map((str, index) => {
            if (index == answerInputMapRef.current.length - 1 && lastGroupNum != 5) {
                switch (modalConfig2Ref.current.data.questionType) {
                    case 'Single':
                        inputReg = new RegExp(`^[ABCDEFG]{${lastGroupNum}}$`);
                        break;
                    case 'Multiple':
                        inputReg = new RegExp(`^[ABCDEFG]{1,7}((\\|[ABCDEFG]{1,7}){${lastGroupNum - 1}})$`);
                        break;
                    case 'Judgment':
                        inputReg = new RegExp(`^[TF]{${lastGroupNum}}$`);
                        break;
                    default:
                        inputReg = /./;
                        break;
                }
            }
            if (str == '') {
                return 2;
            }
            if (inputReg.test(str)) {
                return 1;
            } else {
                return 0;
            }
        })
        let isPass = result.every(item => item == 1);
        setAnswerInputValidate({
            result,
            isPass
        })
    }

    //批量设置分数(填空题、解答题)
    const setGroupScore = () => {
        let temp = formRef.current.questionListData.slice();
        let { questionIndex } = modalConfig2Ref.current.data;
        temp[questionIndex]['list'] = temp[questionIndex]['list'].map((item, index) => {
            return {
                ...item,
                score: scoreValueRef.current,
            }
        })
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
        closeModal2();
    }

    //批量设置分数，答案(仅单选题,多选题,判断题)
    const setGroupScoreAndAnswer = () => {
        let temp = formRef.current.questionListData.slice();
        let { questionIndex, questionType } = modalConfig2Ref.current.data;
        // let answerArr = questionType == 'Multiple' ? answerValueRef.current.split('@') : answerValueRef.current.split('|');

        let answerArr = questionType == 'Multiple'
            ?
            answerInputMapRef.current.join('|').split('|').map(item => item.split('').join(','))
            :
            answerInputMapRef.current.join('').split('');

        // let reg = questionType == 'Multiple' ? /^(\w(\|\w)*)(@\w(\|\w)*)*$/ : /^\w(\|\w)*$/;
        if (scoreValueRef.current == '' || scoreValueRef.current == 0) {
            showAlert({
                title: '请输入每道题的分值',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        if (!answerInputValidateRef.current.isPass) {
            showAlert({
                title: '请按规范填写答案',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        temp[questionIndex]['list'] = temp[questionIndex]['list'].map((item, index) => {
            return {
                ...item,
                score: scoreValueRef.current,
                answerValue: answerArr[index]
            }
        })
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
        closeModal2();
    }

    //滚动到答案及分值设置对应题目的位置
    const scrollToItem = (groupIndex, index = -1) => {
        setTabIndex(1);
        setTimeout(() => {
            if (!ScoreWrapperRef.current) {
                return;
            }
            let domList = ScoreWrapperRef.current.querySelectorAll('.question-setup-group');
            if (index != -1) {
                let childList = domList[groupIndex].querySelectorAll('.question-setup-item');
                ScoreScrollRef.current.scrollTop(childList[index]['offsetTop'] - 8);
            } else {
                ScoreScrollRef.current.scrollTop(domList[groupIndex]['offsetTop']);
            }
            setProgressTipShow(false);
        }, 100)
    }

    //设置页面布局栏数
    const changeCardDisply = (type) => {
        //由于三栏的内容区域宽度小，客观题竖排时超过15会超出内容区，所以栏数变为三栏时限制超出的布局参数
        let quesData = form.questionListData;
        if (type == 3) {
            quesData = form.questionListData.map((questionGroup) => {
                if (questionGroup.showNum > 15 && (questionGroup.type == 'Single' || questionGroup.type == 'Multiple' || questionGroup.type == 'Judgment')) {
                    questionGroup.showNum = 15
                }
                return questionGroup;
            })
        }


        dispatchForm({
            type: 'setForm',
            data: {
                SheetLayout: type,
                questionListData: quesData
            }
        })

        let count = 0;
        showPageDataList.map((pageData, index) => {
            pageData.map((item) => {
                if (item.title && item.type === 'Article' && item.showNum === 2) {
                    setTimeout(() => {
                        count++;
                        inputChangeQuesExtraParam(
                            {
                                target: {
                                    value: item['list'][0]['QuesExtraParam'].split('%')[0] * 1
                                }
                            }
                            , item.NO - 1, item['list'][0]['QuesExtraParam'].split('%')[1], 1, type)
                    }, count * 100)

                }
            })
        })

    }

    //预览答题卡
    const previewCard = () => {
        sessionStorage.setItem('CardObj', JSON.stringify(form));
        sessionStorage.setItem('ShowPageDataList', JSON.stringify(showPageDataListRef.current));
        let token = sessionStorage.getItem('token');
        window.open(`${config.DetailProxy}/html/AnswerSheet/#/preview?lg_tk=${token}`, '_blank');
    }

    //点击完成按钮
    const savaAnswerSheet = async () => {
        console.log(getQuesCoord());
        // getQuesCoord().Arrange
        console.log(JSON.stringify(getQuesCoord()));
        if (form.questionListData.length == 0) {
            showAlert({
                title: '答题卡内容不能为空',
                type: 'warn',
                alertShow: true
            })
            return;
        }
        if (form.Title == '') {
            showAlert({
                title: '答题卡名称不能为空',
                type: 'warn',
                alertShow: true
            })
            return;
        }
        // let isFinishSet = true;
        // progressData.progressInfo.forEach((item)=>{
        //     item.progressList.forEach((childItem)=>{
        //         if(!childItem.isFinish){
        //             isFinishSet = false;
        //         }
        //     })
        // })
        // if(!isFinishSet){
        //     showAlert({
        //         title: <div>有未设置分值及答案的小题</div>,
        //         type: 'warn',
        //         alertShow: true,
        //         onOk: async () => {
        //             alertHide();
        //             // await finishMake();
        //         }
        //     })
        //     setRedTipsShow(true);
        //     return;
        // }
        finishMake();
    }
    const GetAnswerImageFn = (NO, QuesNO) => {
        let AnswerImage = null;
        showPageDataListRef.current.map((item, index) => {
            item.map((item1, idx) => {
                if (item1.NO === NO) {

                }
                item1.list.map((item2, id) => {
                    if (item2.QuesNO === QuesNO && item2.AnswerImage && !AnswerImage) {
                        AnswerImage = item2.AnswerImage
                    }
                })
            })
        })
        return AnswerImage
    }
    //完成答题卡制作
    const finishMake = async () => {
        //题目数据
        console.log(form.questionListData, 231231);
        let QuesStruct = form.questionListData.map((question, index) => {
            return {
                QuesGroupNO: index + 1,
                QuesGroupType: QuestionTypeMap[question.type],
                QuesGroupName: question.title,
                QuesLayoutParam: question.showNum,
                ScoreRule: question.ScoreRule,
                AnswerModel: question.AnswerModel,
                QuesGroupExtraParam: question.QuesGroupExtraParam,
                QuesList: question.list.map((item) => {
                    return {
                        QuesNO: item.QuesNO,
                        QuesScore: item.score,
                        // CorrectAnswer: transformAnserStr(question.type, item.answerValue),
                        NodeCount: question.type == 'Answer' || question.type == 'Other' || question.type == 'OptionalQues' || question.type == 'Article' ? 0 : item.optionNum,
                        AnswerHeight: question.type == 'Answer' || question.type == 'Other' || question.type == 'OptionalQues' || question.type == 'Article' ? item.optionNum : 0,
                        AnswerImage: GetAnswerImageFn(index + 1, item.QuesNO),
                        QuesExtraParam: item.QuesExtraParam ? item.QuesExtraParam : '',
                    }
                })
            }
        })
        if (QuesStruct) {
            let isTrue = true;
            QuesStruct.map((item, idx) => {
                if (item.QuesGroupType === '98' && idx !== QuesStruct.length - 1) {
                    isTrue = false;
                    showAlert({
                        title: '选做题只能设置一题，且为所有题目的最后一题！',
                        type: 'btn-warn',
                        alertShow: true
                    })
                }
            })
            if (!isTrue) {
                return
            }
        }
        //题目位置信息
        let QuesCoord = getQuesCoord();
        QuesCoord.Arrange = form.QuesSortType === 2 ? 'row' : 'col';
        let data = {
            CreatorID: userInfo.UserID,
            UserID: userInfo.UserID,
            UseType: getQueryVariable('usetype') == '2' ? 2 : 1,
            CreatorName: userInfo.UserName,
            CreatorIdentity: (getQueryVariable('creatortype') === '0' || getQueryVariable('creatortype')) && getQueryVariable('creatortype') !== 'false' ? getQueryVariable('creatortype') : 3,
            SubjectID: dropSelect_1.value,
            SubjectName: dropSelect_1.value == '' ? '' : dropSelect_1.title,
            GradeID: dropSelect_2.value.GradeID,
            GlobalGrade: dropSelect_2.value.GlobalGrade,
            GradeName: dropSelect_2.value.GradeID == '' ? '' : dropSelect_2.title,
            Term: curTerm,
            SchoolID: userInfo.SchoolID,
            SheetID: form.SheetID,
            SheetName: form.Title,
            TicketNOLength: form.AdmissionNoLength,
            SheetLayout: form.SheetLayout,
            QuesSortType: form.QuesSortType,
            TicketNOProvideType: form.TicketNOProvideType,
            IsIncludeAB: form.IsIncludeAB,
            QuesCoord: (form.SheetLayout == 3 ? Math.ceil(showPageDataList.length / 3) : showPageDataList.length) + ',' + JSON.stringify(QuesCoord),
            QuesStruct: JSON.stringify(QuesStruct),
            dispatch
        }
        if (form.SheetID) {
            setLoading(true);
            const res = await EditSheet(data);
            setLoading(false);
            if (res && res.ResultCode == 0) {
                showAlert({
                    title: '保存成功',
                    type: 'success',
                    alertShow: true
                })
                if (window.opener) {
                    window.opener.postMessage('updataSheetList', '*');
                } else if (window.parent) {
                    window.parent.postMessage('updataSheetList', '*');
                }
                if (window.location.href.indexOf('localhost:300') === -1)
                    setTimeout(() => {
                        window.close();
                    }, 1500)
                // dispatch({
                //     type: 'setForm',
                //     data: {
                //         SheetID: res.Data.SheetID
                //     }
                // })
            }
        } else {
            setLoading(true);
            const res = await AddSheet(data);
            setLoading(false);
            if (res && res.ResultCode == 0) {
                showAlert({
                    title: '保存成功',
                    type: 'success',
                    alertShow: true
                })
                if (window.opener) {
                    window.opener.postMessage('updataSheetList', '*');
                } else if (window.parent) {
                    window.parent.postMessage('updataSheetList', '*');
                }
                if (window.location.href.indexOf('localhost:300') === -1)
                    setTimeout(() => {
                        window.close();
                    }, 1500)
            }
        }
    }

    //答案字符串转换1（前端----后端）
    const transformAnserStr = (type, str, reverse = false) => {
        let AnserValueMap = {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4,
            'E': 5,
            'F': 6,
            'G': 7,
        }
        let reverseMap = {
            '1': 'A',
            '2': 'B',
            '3': 'C',
            '4': 'D',
            '5': 'E',
            '6': 'F',
            '7': 'G'
        }
        if (reverse) {
            switch (type) {
                case '01':
                    return reverseMap[str] + '';
                case '02':
                    return str.split(',').map((item) => {
                        return reverseMap[item]
                    }).join(',');
                case '03':
                    return str == '1' ? 'T' : 'F';
                default:
                    return '';
            }
        } else {
            switch (type) {
                case 'Single':
                    return AnserValueMap[str];
                case 'Judgment':
                    return str == 'T' ? '1' : '0';
                case 'Multiple':
                    return str.split(',').map((item) => {
                        return AnserValueMap[item]
                    }).join(',');
                default:
                    return '';
            }
        }
    }

    //答案字符串转换2（前端----客户端）
    const transformAnserStr2 = (quesNo, type) => {
        let question = formRef.current.questionListData[quesNo - 1];

        switch (type) {
            case 'Single':
                return question.list.map((item) => {
                    return item.answerValue.toLocaleLowerCase();
                }).join('|');
            case 'Judgment':
                return question.list.map((item) => {
                    return item.answerValue == 'T' ? '1' : '0';
                }).join('|');
            case 'Multiple':
                return question.list.map((item) => {
                    return (item.answerValue.replace(/,/g, '@')).toLocaleLowerCase();
                }).join('|');
            default:
                return '';
        }
    }

    //计算节点相对位置
    const computeDomPosition = (child, parent) => {
        let temp = child;
        let offsetY = 0;
        let offsetX = 0;
        while (temp != parent && temp != document.body) {
            offsetY += temp.offsetTop;
            offsetX += temp.offsetLeft;
            temp = temp.offsetParent;
        }
        return {
            offsetY,
            offsetX,
            offsetWidth: child.offsetWidth,
            offsetHeight: child.offsetHeight
        };
    }

    //获取答题卡位置信息
    const getQuesCoord = () => {

        //每张纸的节点列表
        let cardDomList = Array.from(document.querySelectorAll('.answer-sheet-div'));
        let AnchorPointX = 36;
        let AnchorPointY = 54;
        if (form.SheetLayout === 3) {
            AnchorPointX = 22;
            AnchorPointY = 62;
        }
        //纸张大小
        let cardWidth = cardDomList[0].getBoundingClientRect().width;
        let cardHeight = cardDomList[0].getBoundingClientRect().height;

        //纸张定位点
        let point1 = cardDomList[0].querySelector('.position-point-1');
        let point2 = cardDomList[0].querySelector('.position-point-2');
        let point3 = cardDomList[0].querySelector('.position-point-3');
        let { offsetY: y1, offsetX: x1 } = computeDomPosition(point1, cardDomList[0]);
        let { offsetY: y2, offsetX: x2 } = computeDomPosition(point2, cardDomList[0]);
        let { offsetY: y3, offsetX: x3 } = computeDomPosition(point3, cardDomList[0]);
        let h = point1.offsetHeight;
        let w = point1.offsetWidth;
        if (form.SheetLayout == 3) {
            x2 = cardWidth * 3 - 70;
        }

        let admissionDom = document.querySelector('.admission-content');
        let { offsetY: offsetY1, offsetX: offsetX1 } = computeDomPosition(admissionDom, cardDomList[0]);
        let offsetY2 = admissionDom.offsetHeight + offsetY1;
        let offsetX2 = admissionDom.offsetWidth + offsetX1;

        let pageQuestionArr = cardDomList.map((card) => {
            let questionDomList = Array.from(card.querySelectorAll('.question-list-wrapper'));
            return {
                parentNode: card,
                questionDomList,
            }
        })

        let QuesNo = 0;
        let PositionInfo = [];
        console.log(pageQuestionArr, 3221312);
        pageQuestionArr.forEach((item, idx) => {
            let PositionArr = [];

            //三栏布局时，坐标按整页传，columnNo为栏下标
            let columnNo = form.SheetLayout == 3 ? idx % 3 : 0;

            item.questionDomList.forEach((child) => {
                let { offsetY: offsetY1, offsetX: offsetX1 } = computeDomPosition(child, item.parentNode);
                let offsetY2 = child.offsetHeight + offsetY1;
                let offsetX2 = child.offsetWidth + offsetX1;
                let answerList = Array.from(child.querySelectorAll('.answer-question-item'));   //当前页面的解答题小题节点
                let rowList = Array.from(child.querySelectorAll('.row-list'));    //选择题或判断题的行节点
                let groupList = Array.from(child.querySelectorAll('.question-group'));    //选择题或判断题的每小块节点
                console.log(groupList, 2131312313, '长度');
                let completionList = Array.from(child.querySelectorAll('.completion-question-item'));   //填空题小题节点
                let pos = {
                    top: offsetY1,
                    left: offsetX1 + columnNo * cardWidth,
                    bottom: offsetY2,
                    right: offsetX2 + columnNo * cardWidth
                }
                let contentPos;
                let completionPos;
                let answerPos;
                let groupPos = [];
                let labelsCount = [];
                if (groupList.length > 0) {
                    groupList.map((it) => {
                        let { offsetY: offsetY1, offsetX: offsetX1 } = computeDomPosition(it, item.parentNode);
                        let offsetY2 = it.offsetHeight + offsetY1;
                        let offsetX2 = it.offsetWidth + offsetX1;
                        groupPos.push([
                            offsetX1 - AnchorPointX,
                            offsetY1 - AnchorPointY,
                            offsetX2 - AnchorPointX,
                            offsetY2 - AnchorPointY,
                        ])
                        labelsCount.push(Math.ceil((it.offsetWidth - 30) / 25))
                        // let labelsCount1 = Math.ceil((it.offsetWidth - 30) / 25)
                        // if (labelsCount < labelsCount1) {
                        //     labelsCount = labelsCount1;
                        // }

                    })
                    //   console.log(groupPos,3123123);
                }
                if (rowList.length > 0) {
                    let maxRowWidth = computeDomPosition(rowList[0], item.parentNode)['offsetWidth'];
                    rowList.forEach((rowNode) => {
                        if (computeDomPosition(rowNode, item.parentNode)['offsetWidth'] > maxRowWidth) {
                            maxRowWidth = computeDomPosition(rowNode, item.parentNode)['offsetWidth'];
                        }
                    })
                    contentPos = {
                        top: (computeDomPosition(rowList[0], item.parentNode)['offsetY'] + 10),
                        left: (computeDomPosition(rowList[0], item.parentNode)['offsetX']),
                        right: (computeDomPosition(rowList[0], item.parentNode)['offsetX'] + maxRowWidth - 10),
                        bottom: (computeDomPosition(rowList[rowList.length - 1], item.parentNode)['offsetY'] + computeDomPosition(rowList[rowList.length - 1], item.parentNode)['offsetHeight'] - 10)
                    }
                }
                // if (groupList.length > 0) {
                //     let maxRowWidth = computeDomPosition(groupList[0], item.parentNode)['offsetWidth'];
                //     groupList.forEach((rowNode) => {
                //         if (computeDomPosition(rowNode, item.parentNode)['offsetWidth'] > maxRowWidth) {
                //             maxRowWidth = computeDomPosition(rowNode, item.parentNode)['offsetWidth'];
                //         }
                //     })
                //     groupPos = {
                //         top: (computeDomPosition(groupList[0], item.parentNode)['offsetY'] + 10),
                //         left: (computeDomPosition(groupList[0], item.parentNode)['offsetX']),
                //         right: (computeDomPosition(groupList[0], item.parentNode)['offsetX'] + maxRowWidth - 10),
                //         bottom: (computeDomPosition(groupList[groupList.length - 1], item.parentNode)['offsetY'] + computeDomPosition(groupList[groupList.length - 1], item.parentNode)['offsetHeight'] - 10)
                //     }
                // }

                if (answerList.length > 0) {
                    answerPos = answerList.map((_item) => {
                        let { offsetY: offsetY1, offsetX: offsetX1 } = computeDomPosition(_item, item.parentNode);
                        let offsetY2 = _item.offsetHeight + offsetY1;
                        let offsetX2 = _item.offsetWidth + offsetX1;
                        return {
                            top: offsetY1,
                            left: offsetX1 + columnNo * cardWidth,
                            right: offsetX2 + columnNo * cardWidth,
                            bottom: offsetY2,
                            no: parseInt(_item.dataset.no)
                        }
                    })
                }


                if (completionList.length > 0) {
                    completionPos = completionList.map((_item) => {
                        let { offsetY: offsetY1, offsetX: offsetX1 } = computeDomPosition(_item, item.parentNode);
                        let offsetY2 = _item.offsetHeight + offsetY1;
                        let offsetX2 = _item.offsetWidth + offsetX1;
                        return {
                            top: offsetY1,
                            left: offsetX1 + columnNo * cardWidth,
                            right: offsetX2 + columnNo * cardWidth,
                            bottom: offsetY2,
                        }
                    })
                }
                PositionArr.push({
                    pos,
                    contentPos,
                    completionPos,
                    answerPos,
                    groupPos,
                    labelsCount,
                    // groupPos,
                    questype: child.dataset.questype,
                    startIndex: parseInt(child.dataset.startindex)
                });
            })

            PositionArr.forEach((point, i) => {
                if (showPageDataList[idx][i]['title']) {
                    QuesNo++;
                }
                if (!PositionInfo[QuesNo]) {
                    PositionInfo[QuesNo] = {
                        PageNo: idx + 1,
                        QuesNo: QuesNo,
                        Location: [point.pos],
                        ContentLocation: [point.contentPos],
                        CompletionLoaction: [point.completionPos],
                        AnswerLocation: [point.answerPos],
                        GroupLocation: [point.groupPos],
                        labelsCount: [point.labelsCount],
                        questype: point.questype,
                        startIndex: point.startIndex
                    }
                } else {
                    let len = PositionInfo[QuesNo]['Location'].length;
                    PositionInfo[QuesNo]['Location'][len] = point.pos;
                    PositionInfo[QuesNo]['ContentLocation'][len] = point.contentPos;
                    PositionInfo[QuesNo]['CompletionLoaction'][len] = point.completionPos;
                    PositionInfo[QuesNo]['AnswerLocation'][len] = point.answerPos;
                    PositionInfo[QuesNo]['GroupLocation'][len] = point.groupPos;
                    PositionInfo[QuesNo]['labelsCount'][len] = point.labelsCount;
                }
            })
        })

        // QuesNo从1开始，所以第一项为空删除
        PositionInfo = PositionInfo.slice(1, PositionInfo.length);

        let QuesCoord = JSON.parse(JSON.stringify(PositionObjTemplate));
        QuesCoord.IDNumber = form.AdmissionNoLength;
        QuesCoord.Style = form.SheetLayout == 1 ? 'A4' : 'A3';
        QuesCoord.Size = [cardWidth, cardHeight];
        QuesCoord.Column = form.SheetLayout;

        //区分A、B卷
        let diffPaperArea = document.querySelector('.diff-paper-label');
        let areaA = document.querySelector('#diff-paper-area-A');
        let areaB = document.querySelector('#diff-paper-area-B');
        if (form.IsIncludeAB == 1) {
            QuesCoord.DiffPaper = [
                computeDomPosition(diffPaperArea, cardDomList[0]),
                computeDomPosition(areaA, cardDomList[0]),
                computeDomPosition(areaB, cardDomList[0])
            ].map((rect) => {
                return [rect.offsetX - AnchorPointX, rect.offsetY - AnchorPointY, rect.offsetX + rect.offsetWidth - AnchorPointX, rect.offsetY + rect.offsetHeight - AnchorPointY]
            })
        }
        if (form.SheetLayout == 3) {
            QuesCoord.Size = [cardWidth * 3, cardHeight];
        } else {
            QuesCoord.Size = [form.SheetLayout == 1 ? cardWidth : cardWidth * 2, cardHeight];
        }
        QuesCoord.Sign = [
            // [x1, y1, (x1 + w), (y1 + h)],
            // [x2, y2, (x2 + w), (y2 + h)],
            // [x3, y3, (x3 + w), (y3 + h)]
        ]
        if (form.TicketNOProvideType.includes('1')) {
            QuesCoord.StudentID = [
                [offsetX1 - AnchorPointX, offsetY1 - AnchorPointY, offsetX2 - AnchorPointX, (offsetY1 + 40 - AnchorPointY)],
                [offsetX1 - AnchorPointX, (offsetY1 + 40 - AnchorPointY), offsetX2 - AnchorPointX, offsetY2 - AnchorPointY]
            ]
        }

        if ((form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3'))) {
            let barAreaDom = document.querySelector('.bar-code-area');
            let { offsetY: barY, offsetX: barX, offsetHeight: barH, offsetWidth: barW } = computeDomPosition(barAreaDom, cardDomList[0]);
            QuesCoord.BarCode = [
                [barX - AnchorPointX, barY - AnchorPointY, barX + barW - AnchorPointX, barY + barH - AnchorPointY]
            ]
        }
        console.log(PositionInfo, 312312312);
        PositionInfo.forEach((quesGroupItem) => {
            let pageArr = [];
            switch (quesGroupItem.questype) {
                case 'Single':
                case 'Multiple':
                case 'Judgment':
                    let key = quesGroupItem.questype;
                    let labels = [];
                    if (quesGroupItem.questype == 'Judgment') {
                        key = 'Judge';
                        labels = ['T', 'F'];
                    } else {
                        let labelsCount = 0;
                        quesGroupItem.labelsCount.map((item, pageIndex) => {
                            item.map((it) => {
                                if (it > labelsCount) {
                                    labelsCount = it;
                                }
                            })
                            let arr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y", "Z"];
                            labels = arr.slice(0, labelsCount);
                        })
                    }

                    // pageArr = quesGroupItem.Location.map((rect, pageIndex) => {
                    //     return quesGroupItem.PageNo + pageIndex;
                    // })
                    let region = [];
                    quesGroupItem.GroupLocation.map((item, pageIndex) => {
                        item.map((it) => {
                            pageArr.push(quesGroupItem.PageNo + pageIndex);
                            region.push(it);
                        })
                    })
                    if (form.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3));
                    }
                    QuesCoord[key].push({
                        order: quesGroupItem.QuesNo,
                        labels,
                        page: pageArr,
                        region,
                        // labelsCount
                        // region: quesGroupItem.Location.map((rect) => {
                        //     return [
                        //         rect.left,
                        //         rect.top,
                        //         rect.right,
                        //         rect.bottom,
                        //     ]
                        // }),
                        // content: quesGroupItem.ContentLocation.map((rect)=>{
                        //     return [
                        //         rect.left,
                        //         rect.top,
                        //         rect.right,
                        //         rect.bottom,
                        //     ]
                        // }),
                        answer: ''
                    })
                    break;
                case 'Completion':
                    let complePos = [];
                    let compleNoIdex = quesGroupItem.startIndex;
                    let locationArr = quesGroupItem.CompletionLoaction.filter(arr => arr != undefined);
                    locationArr.map((arr, pageIndex) => {
                        pageArr.push(quesGroupItem.PageNo + pageIndex);
                        arr.forEach((comple) => {
                            complePos.push({
                                NO: compleNoIdex,
                                page: form.SheetLayout == 3 ? Math.ceil((quesGroupItem.PageNo + pageIndex) / 3) : quesGroupItem.PageNo + pageIndex,
                                region: [
                                    comple.left,
                                    comple.top,
                                    comple.right,
                                    comple.bottom,
                                ],
                            })
                            compleNoIdex++;
                        })
                    })
                    if (form.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3));
                    }
                    QuesCoord.Blank.push({
                        order: quesGroupItem.QuesNo,
                        page: pageArr,
                        region: quesGroupItem.Location.map((rect) => {
                            return [
                                rect.left,
                                rect.top,
                                rect.right,
                                rect.bottom,
                            ]
                        }),
                        question: complePos
                    })
                    break;
                case 'Other':
                case 'OptionalQues':
                case 'Answer':
                    let answerPos = []
                    let locationArr2 = quesGroupItem.AnswerLocation.filter(arr => arr != undefined);
                    if (document.querySelector('#OptionalQues-ChooseQues') && quesGroupItem.questype === 'OptionalQues') {
                        let { offsetY: barY, offsetX: barX, offsetHeight: barH, offsetWidth: barW } = computeDomPosition(document.querySelector('#OptionalQues-ChooseQues'), cardDomList[locationArr2[0].no]);
                        let ChooseQues = [];
                        for (let i = 0; i < $('#OptionalQues-ChooseQues .ChooseQues-span').length - 1; i++) {
                            if (i === 0) {
                                barX += 12;
                                barH = 12;
                                barW = 19;
                            } else {
                                barX += 31;
                            }
                            ChooseQues.push([barX, barY, barX + barW, barY + barH])
                        }
                        QuesCoord.ChooseQues = ChooseQues;

                    }
                    locationArr2.forEach((arr, pageIndex) => {
                        pageArr.push(quesGroupItem.PageNo + pageIndex);
                        arr.forEach((answer) => {
                            if (answerPos[answer.no - quesGroupItem.startIndex]) {
                                let answerPosItem = answerPos[answer.no - quesGroupItem.startIndex];
                                answerPosItem['region'].push([
                                    answer.left,
                                    answer.top,
                                    answer.right,
                                    answer.bottom,
                                ])

                                let len = answerPosItem['page']['length'];
                                answerPosItem['page'].push(
                                    form.SheetLayout == 3
                                        ?
                                        Math.ceil((quesGroupItem.PageNo + pageIndex) / 3)
                                        :
                                        answerPosItem['page'][len - 1] + 1
                                )
                            } else {
                                answerPos.push({
                                    NO: answer.no,
                                    page: [form.SheetLayout == 3 ? Math.ceil((quesGroupItem.PageNo + pageIndex) / 3) : quesGroupItem.PageNo + pageIndex],
                                    region: [[
                                        answer.left,
                                        answer.top,
                                        answer.right,
                                        answer.bottom,
                                    ]],
                                })
                            }
                        })
                    })
                    if (form.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3));
                    }
                    QuesCoord.Solution.push({
                        order: quesGroupItem.QuesNo,
                        page: pageArr,
                        region: quesGroupItem.Location.map((rect) => {
                            return [
                                rect.left,
                                rect.top,
                                rect.right,
                                rect.bottom,
                            ]
                        }),
                        question: answerPos
                    })
                    break;
                case 'Article':
                    pageArr = quesGroupItem.Location.map((rect, pageIndex) => {
                        return quesGroupItem.PageNo + pageIndex;
                    })
                    if (form.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3));
                    }
                    QuesCoord.Essay.push({
                        order: quesGroupItem.QuesNo,
                        page: pageArr,
                        region: quesGroupItem.Location.map((rect) => {
                            return [
                                rect.left,
                                rect.top,
                                rect.right,
                                rect.bottom,
                            ]
                        }),
                    })
                    break;
            }
        })
        let Rate = 3.125;
        QuesCoord['AnchorPoint'] = [0, 0, Math.ceil((AnchorPointX + 48) * Rate), Math.ceil((AnchorPointY + 8) * Rate)];
        return QuesCoord;
    }
    // const [TicketNOProvideTypeObj, setTicketNOProvideTypeObj] = useState({
    //     value: '',
    //     List: [],
    // })
    // const ChangeTicketNOProvideTypeValue = (value) => {

    // }
    const [showPageDataListIndex, setshowPageDataListIndex] = useState({
        index: 0,
        idx: 0,
        id: 0,
    });
    const showPageDataListIndexRef = useStateValue(showPageDataListIndex);
    const UpLoadFn = (item, index, idx, id) => {
        // console.log(showPageDataList,12313);
        // setshowPageDataListId(index + '-' + idx + '-' + id);
        setshowPageDataListIndex({
            index,
            idx,
            id,
        })
        console.log(showPageDataList[index][idx].list[id])
        chooseInput();
    }
    const dateRef = useRef();
    const FameRef = useRef();
    // const
    const chooseInput = () => {
        dateRef.current.click();
    }
    const ChangeFileList = (e) => {
        let fileLength = e.target.files.length;
        // let ele = e;
        let file = e.target.files[0];
        // let fileAll = $("#files").clone(true);
        // console.log(fileAll, 9986);
        if (!file) {
            return
        }
        // let typeArr = ['png', 'pneg', 'jpg', 'jpeg', 'bmp', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'txt'];
        let imgArr = ['png', 'pneg', 'jpg', 'jpeg', 'bmp'];//'bmp'
        // let fileList = [];
        // let fileimg = fileimgRef.current;

        if (!imgArr.some((item) => {
            return item == (e.target.files[0].name.slice(e.target.files[0].name.lastIndexOf('.') + 1, e.target.files[0].name.length)).toLowerCase();
        })) {
            alertShow({
                type: 'btn-tips',
                show: true,
                title: '支持png,jpg,bmp格式图片',
                // title: "作答附件资料只支持png,jpg,jpeg格式图片",
            })
            e.target.value = '';
            return

        }
        setLoading(true);

        let f = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            //加载图片获取图片真实宽度和高度  
            var image = new Image();
            image.onload = function () {

                var width = image.width;
                var height = image.height;
                // console.log(width, height, 1321231);
                let item = showPageDataList[showPageDataListIndexRef.current.index][showPageDataListIndexRef.current.idx].list[showPageDataListIndexRef.current.id];
                let NowWidth = form.SheetLayout === 3 ? 465.77 : 703.88;
                let NowHight = item.optionNum * 30 - 20;
                let ShowWidth = width;
                let ShowHight = height;
                if (width > NowWidth || height > NowHight) {
                    if (width / NowWidth > height / NowHight) {
                        ShowWidth = NowWidth * 0.8;
                        ShowHight = height / (width / (NowWidth * 0.8));
                    } else {
                        ShowHight = NowHight * 0.8;
                        ShowWidth = width / (height / (NowHight * 0.8));
                    }
                }
                if (ShowHight < 30) {

                    ShowWidth = ShowWidth * 30 / ShowHight;
                    ShowHight = 30;
                }
                item.AnswerImage = {
                    ImageSize: ShowWidth.toFixed(2) + '%' + ShowHight.toFixed(2),
                    ImagePageIndex: 1,
                    ImagePosition: 2 + '%' + 0,
                }
                upDatafile(file);
            };
            image.src = data;
        };
        reader.readAsDataURL(f);
    }
    const upDatafile = (file, path = '', hasSendNum = 0) => {

        let that = this;
        // console.log(file, path, hasSendNum, index, 5599);
        let Year = new Date().getFullYear();
        let Month = new Date().getMonth() + 1;
        let formData = new FormData($('#formData')[0]);
        formData.append('path', path);
        formData.append('method', 'doUpload_WholeFile');
        formData.append('userid', JSON.parse(sessionStorage.getItem("UserInfo")).UserID);
        formData.append('threads', 1);
        formData.append('isPaused', hasSendNum == 0 ? 0 : 1);
        formData.append('chunkSize', 1);
        formData.append('filename', file.name);
        formData.append('chunk', hasSendNum);
        formData.append('chunks', Math.ceil(file.size / 1024 / 1024));
        formData.append('diskName', 'CorrectPaperTest/AnswerFile/' + Year + '-' + Month + '/');
        let slice = file.slice(hasSendNum * BYTES_PER_SLICE, (hasSendNum + 1) * BYTES_PER_SLICE);//切割文件
        formData.append('file', slice);
        $.ajax({
            url: JSON.parse(sessionStorage.getItem("PapergradebaseInfo")).ResHttpServerUrl + '/file',
            type: 'POST',
            cache: false,
            data: formData,
            //dataType: 'json',
            //async: false,
            processData: false,
            contentType: false,
        }).done(function (res) {
            // console.log(res, 32211235);
            path = JSON.parse(res).filePath;
            // console.log(hasSendNum, Math.floor(file.size / BYTES_PER_SLICE));
            if (hasSendNum !== Math.floor(file.size / BYTES_PER_SLICE)) {
                // console.log(hasSendNum)
                // slice = file.slice(hasSendNum * BYTES_PER_SLICE, (hasSendNum + 1) * BYTES_PER_SLICE);//切割文件
                hasSendNum++;
                upDatafile(file, path, hasSendNum);
            } else {
                let { index, idx, id } = showPageDataListIndexRef.current;
                showPageDataList[index][idx].list[id].AnswerImage.ImagePath = path;
                setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));
                // console.log(showPageDataList, 1231231);
                setLoading(false);
                setTimeout(() => {
                    $('#files').attr('value', '');
                }, 500)
            }
            return;
        }).fail(function (res) {


        });
    }
    const ImgToUpFN = (item, index, idx, id) => {
        if (showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[1] * 1 === 0) {
            if (item.optionNum === item.originOptionNum * 1 || !item.hiddenNo) {
                return
            } else {
                console.log(item.quesIndex, 123131);
                showPageDataList[index - 1][showPageDataList[index - 1].length - 1].list[showPageDataList[index - 1][showPageDataList[index - 1].length - 1].list.length - 1].AnswerImage = JSON.parse(JSON.stringify(showPageDataList[index][idx].list[id].AnswerImage));
                showPageDataList[index - 1][showPageDataList[index - 1].length - 1].list[showPageDataList[index - 1][showPageDataList[index - 1].length - 1].list.length - 1].AnswerImage.ImagePageIndex = item.AnswerImage.ImagePageIndex + 1;
                showPageDataList[index - 1][showPageDataList[index - 1].length - 1].list[showPageDataList[index - 1][showPageDataList[index - 1].length - 1].list.length - 1].AnswerImage.ImagePosition = item.AnswerImage.ImagePosition.split('%')[0] + '%' + 0;
                showPageDataList[index][idx].list[id].AnswerImage = null;
            }

        } else {

            showPageDataList[index][idx].list[id].AnswerImage.ImagePosition = showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[0] + '%' + (item.AnswerImage.ImagePosition.split('%')[1] - 1);
        }

        setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));
    }
    const ImgToDownFN = (item, index, idx, id) => {
        if (showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[1] * 1 === 2) {
            if (item.optionNum === item.originOptionNum * 1 || showPageDataList.length - 1 === index || (showPageDataList[index + 1][0].list[0].QuesNO !== item.QuesNO && showPageDataList[index + 1][0].list[0].quesIndex - 1 === item.quesIndex)) {
                return
            } else {
                showPageDataList[index + 1][0].list[0].AnswerImage = JSON.parse(JSON.stringify(showPageDataList[index][idx].list[id].AnswerImage));
                showPageDataList[index + 1][0].list[0].AnswerImage.ImagePageIndex = showPageDataList[index + 1][0].list[0].AnswerImage.ImagePageIndex + 1;
                showPageDataList[index + 1][0].list[0].AnswerImage.ImagePosition = showPageDataList[index + 1][0].list[0].AnswerImage.ImagePosition.split('%')[0] + '%' + 0;
                showPageDataList[index][idx].list[id].AnswerImage = null;
            }
        } else {
            showPageDataList[index][idx].list[id].AnswerImage.ImagePosition = showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[0] + '%' + (item.AnswerImage.ImagePosition.split('%')[1] * 1 + 1);
        }
        setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));

    }
    const ImgToLeftFN = (item, index, idx, id) => {
        if (showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[0] * 1 === 0) {
            return
        } else {
            showPageDataList[index][idx].list[id].AnswerImage.ImagePosition = (showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[0] * 1 - 1) + '%' + showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[1];
        }


        setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));

    }
    const ImgToRightFN = (item, index, idx, id) => {
        if (showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[0] * 1 === 2) {
            return
        } else {
            showPageDataList[index][idx].list[id].AnswerImage.ImagePosition = (showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[0] * 1 + 1) + '%' + showPageDataList[index][idx].list[id].AnswerImage.ImagePosition.split('%')[1];
        }


        setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));

    }
    const ImgToSmallFN = (item, index, idx, id) => {
        let width = showPageDataList[index][idx].list[id].AnswerImage.ImageSize.split('%')[0];
        let height = showPageDataList[index][idx].list[id].AnswerImage.ImageSize.split('%')[1];
        showPageDataList[index][idx].list[id].AnswerImage.ImageSize = width - 20 + '%' + (height * (width - 20) / width).toFixed(2);

        setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));
    }
    const ImgToBigFN = (item, index, idx, id) => {
        let width = showPageDataList[index][idx].list[id].AnswerImage.ImageSize.split('%')[0] * 1;
        let height = showPageDataList[index][idx].list[id].AnswerImage.ImageSize.split('%')[1];
        showPageDataList[index][idx].list[id].AnswerImage.ImageSize = width + 20 + '%' + (height * (width + 20) / width).toFixed(2);
        setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));
    }
    const ImgDelFN = (item, index, idx, id) => {
        showPageDataList[index][idx].list[id].AnswerImage = null;
        setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));
    }
    const GetChooseQuesHtmlFN = (item) => {
        let List = [];
        if (!item.AnswerModel) {
            return
        }
        for (let i = 0; i < item.AnswerModel.split('%')[0] * 1; i++) {
            List.push(i + item.list[0].QuesNO);
        }
        return List.map((item) => {
            return <span className="ChooseQues-span"><b>{item}</b></span>
        })
    }

    const ChangeComletionWord = (value, item, idx2, i) => {

        if (item.QuesExtraParam) {
            let arr = item.QuesExtraParam.split(',');
            arr[i] = value;
            item.QuesExtraParam = arr.join(',');
        } else {
            (new Array(item.optionNum)).fill('').map((blank, idx) => {
                if (idx === i) {
                    item.QuesExtraParam += value + ',';
                } else {
                    item.QuesExtraParam += ',';
                }

            }
            )

        }
        console.log(value, item, idx2, i, item, 2321312);
        let temp = formRef.current.questionListData.slice();
        console.log(temp, 2321312);
        // console.log(index3,index2,idx2,2321312)
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
        // showPageDataList[index3][index2].list[idx2] = item;
        // showPageDataList[index3][index2].rowGroupList[idx2] = item;
        // setshowPageDataList(JSON.parse(JSON.stringify(showPageDataList)));
        // if(type){

        // }

        console.log(value, item, i, 213123);
    }
    const GetComletionFN = (data, columns = 1, displayType = 2, changeAnswerHeight = '', showPageDataList = {}, index3 = 0, index2) => {
        let mmWidth = '';
        if (!mmWidth || mmWidth < 1) {
            mmWidth = getOneMmsPx();
        }
        let charArr = [];
        console.log(data, 3213213);
        let rowData = restructData(data, data.type, columns);
        let useRate = rowData.map((row) => {          //行宽度利用率数组
            let rowTotalEmpty = 0;
            row.forEach((item) => {
                rowTotalEmpty += item.optionNum;
            })
            if (rowTotalEmpty / data.showNum > 1) {
                return 1;
            }
            return rowTotalEmpty / data.showNum;
        })
        let renderWidth = 191 * mmWidth - 38;
        if (columns == 3) {
            renderWidth = 128 * mmWidth - 38;
        }

        return (
            <div className="completion-groups-wrapper">
                {
                    rowData.map((arr, index) => {
                        return (
                            <div className="completion-row-wrapper" style={{ display: 'inline-block', maxWidth: '100%' }} key={index}>
                                {arr.map((item, _index) => {
                                    return (
                                        <div className="completion-question-item" key={_index} style={{ display: 'inline-block', maxWidth: '100%' }}>
                                            {(new Array(item.optionNum)).fill('').map((blank, i) => {
                                                return (
                                                    <span style={{ display: 'inline-block', maxWidth: '100%' }}>
                                                        <Tooltip placement="top"
                                                            // visible={true}
                                                            getPopupContainer={trigger => trigger}
                                                            // trigger={'click'}
                                                            overlayClassName={"ShowQuesImage-div ShowQuesImage-div-Tooltip"}
                                                            title={<><div className="ShowQuesImage-div-div">
                                                                填空长度： <Input
                                                                    className="answer-height-input"
                                                                    maxLength={3}
                                                                    type="number"
                                                                    style={{ width: '80px', marginRight: '2px' }}
                                                                    value={item.QuesExtraParam && item.QuesExtraParam.split(',')[i] ? item.QuesExtraParam.split(',')[i] : Math.ceil((renderWidth / data.showNum - 35) / 25)}
                                                                    onChange={(e) => { ChangeComletionWord(e.target.value, item, _index, i) }}
                                                                    // onBlur={(e) => {
                                                                    //     ChangeComletionWord(e.target.value, item,index3,index2,index, _index, i,1)
                                                                    // }}
                                                                    onPressEnter={(e) => {
                                                                        ChangeComletionWord(e.target.value, item, _index, i, 1)
                                                                    }}
                                                                ></Input>字
                                                            </div> </>}>
                                                            <div className="blank-wrapper" key={i} style={{ width: item.QuesExtraParam && item.QuesExtraParam.split(',')[i] ? `${item.QuesExtraParam.split(',')[i] * 25 + 35}px` : `calc(${renderWidth}px / ${data.showNum})`, maxWidth: '100%' }}>
                                                                <div className="item-no">
                                                                    <span>{i == 0 && `${item.QuesNO}、`}</span>
                                                                </div>
                                                                <u className="blank-item" style={{ msFlex: 1 }}></u>
                                                            </div>
                                                        </Tooltip>
                                                    </span>)
                                            })
                                            }
                                        </div>



                                    )
                                })}
                            </div>
                        )
                    })
                }
            </div>
        )
    }
    const GetAllSorceFN = (List) => {
        let Count = 0;
        if (List && List.length > 0) {
            List.map((item) => {
                if (item.list) {
                    item.list.map((it) => {
                        Count += it.score * 1;
                    })
                }
            })
        }
        // console.log(List, 3131);
        if (Count > 0) {
            return <b className="AllSorce-b">(共{Count}分)</b>
        } else {
            return ''
        }
    }
    return (
        <Loading spinning={loading} tip="加载中...">
            <div className="answer-sheet-container">
                {/* 答题卡容器 */}
                <div className="answer-content-wrapper">
                    <Scrollbars
                        autoHeight
                        autoHeightMax={'1060px'}
                    >
                        {
                            showPageDataList.map((pageData, index) => {
                                return (
                                    <div className={form.SheetLayout == 3 ? "answer-sheet-div display-card-three-columns" : "answer-sheet-div"} key={index}>
                                        <div className="page-box">
                                            <div className="position-point-1"></div>
                                            <div className="position-point-2"></div>
                                            <div className="position-point-3"></div>
                                            {/* <div className="position-point-4"></div> */}
                                            {index == 0 &&
                                                <div className="answer-sheet-title">
                                                    {form.Title}
                                                    {/* <Input
                                                    placeholder="请输入答题卡名称"
                                                    value={form.Title}
                                                    size={30}
                                                    onChange={inputChange_1}
                                                    onBlur={inputBlur_1}
                                                    ref={(el)=>{inputRef_1.current=el}}
                                                ></Input> */}
                                                </div>
                                            }
                                            {index == 0 &&
                                                <div className="answer-sheet-head">
                                                    <div className={form.TicketNOProvideType.includes('1') && (form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3')) ? "top-nav-div has-code-bar" : "top-nav-div"}>
                                                        <div className="basic-info">
                                                            <div>学校：<b></b></div>
                                                            <div>班级：<b></b></div>
                                                        </div>
                                                        <div className="basic-info">
                                                            <div>姓名：<b></b></div>
                                                            <div>座号：<b></b></div>
                                                        </div>
                                                        {(form.IsIncludeAB == 1 || (form.TicketNOProvideType.includes('1') && (form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3')))) &&
                                                            <>
                                                                {form.IsIncludeAB == 1 && <div className="diff-paper-label" style={{}}>
                                                                    <div>试卷类型:</div>
                                                                    <div >
                                                                        <b id='diff-paper-area-A'>[A]</b>
                                                                    </div>
                                                                    <div >
                                                                        <b id='diff-paper-area-B'>[B]</b>
                                                                    </div>
                                                                    {/* <div>缺考标记：<i></i></div> */}
                                                                </div>}
                                                                {(form.TicketNOProvideType.includes('1') && (form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3'))) && <div className="bar-code-area">{form.TicketNOProvideType.includes('3') ? '二维码' : '条形码'}粘贴区</div>}
                                                            </>
                                                        }
                                                    </div>
                                                    <div className="info-desc" style={form.TicketNOProvideType.includes('1') ? {} : { height: "225px" }}>
                                                        <div className={form.TicketNOProvideType.includes('1') ? "info-desc-left-div" : "info-desc-left-div info-desc-left-div2"} >
                                                            <div className="desc-title">注意事项</div>
                                                            <div className="left-content-1">
                                                                <div style={{ padding: '2px 10px' }}>
                                                                    1.答题前请将姓名、班级、座位号、准考证号填写清楚。<br></br>
                                                                    2.客观题答题，须使用2B铅笔填涂，修改时用橡皮擦干净。<br></br>
                                                                    3.主观题答题，须使用黑色签字笔书写.<br></br>
                                                                    4.必须在题号对应的答题区域内作答。<br></br>
                                                                    5.请保持答题卡清洁完整。
                                                                </div>

                                                            </div>
                                                            <div className="left-content-2">
                                                                <div className="line-1">
                                                                    <div style={form.TicketNOProvideType.includes('1') && (form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3')) ? { justifyContent: 'flex-start' } : {}}>正确填涂：<i></i></div>
                                                                    {/* {!(form.TicketNOProvideType.includes('1') && (form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3'))) && <div>缺考标记：<i></i></div>} */}
                                                                </div>
                                                                <div className="line-2">
                                                                    <div>错误填涂：<i></i></div>
                                                                </div>
                                                            </div>
                                                            <div className={form.TicketNOProvideType.includes('1') ? "left-content-3" : "left-content-3 left-content-31"}>
                                                                <div className="line-1">
                                                                    <div></div>

                                                                    <div className="line-2">缺考标记：<i></i></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {form.TicketNOProvideType.includes('1') ? <div className="info-desc-right-div" style={{ borderLeft: '1px solid #e44c5d', borderRight: '1px solid #e44c5d' }}>
                                                            <div className="desc-title">
                                                                <span className="title" >准考证号</span>
                                                                {form.TicketNOProvideType !== '2' && form.TicketNOProvideType !== '3' && <span className="edit-btn" onClick={() => { setModalShow_1(true); setinputValue_2(form.AdmissionNoLength) }} >编辑</span>}
                                                            </div>
                                                            <div className="admission-content">
                                                                {form.TicketNOProvideType === '2' || form.TicketNOProvideType === '3' ?
                                                                    <div className="bar-code-area">贴{form.TicketNOProvideType === '3' ? '二维码' : '条形码'}区</div>
                                                                    :
                                                                    <div className="admission-number-table">
                                                                        {
                                                                            Array.from(Array(form.AdmissionNoLength), (v, k) => k).map((item, index) => {
                                                                                return (
                                                                                    <div className="column-item" key={index}>
                                                                                        <div className="blank-td"></div>
                                                                                        <div className="fill-td-wrapper">
                                                                                            {
                                                                                                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((fillItem, _index) => {
                                                                                                    // if(index==0 && _index==0){
                                                                                                    //     return (
                                                                                                    //         <div className="fill-item-td" key={fillItem}>
                                                                                                    //         </div>
                                                                                                    //     )
                                                                                                    // }
                                                                                                    return (
                                                                                                        <div className="fill-item-td" key={fillItem}>
                                                                                                            <span>[</span>
                                                                                                            <span>{fillItem}</span>
                                                                                                            <span>]</span>
                                                                                                        </div>
                                                                                                    )
                                                                                                })
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            })
                                                                        }
                                                                    </div>
                                                                }
                                                            </div>
                                                        </div> : <div className="admission-content">
                                                            {form.TicketNOProvideType === '2' || form.TicketNOProvideType === '3' ?
                                                                <div className="bar-code-area">贴{form.TicketNOProvideType === '3' ? '二维码' : '条形码'}区</div>
                                                                :
                                                                <div className="admission-number-table">
                                                                    {
                                                                        Array.from(Array(form.AdmissionNoLength), (v, k) => k).map((item, index) => {
                                                                            return (
                                                                                <div className="column-item" key={index}>
                                                                                    <div className="blank-td"></div>
                                                                                    <div className="fill-td-wrapper">
                                                                                        {
                                                                                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((fillItem, _index) => {
                                                                                                // if(index==0 && _index==0){
                                                                                                //     return (
                                                                                                //         <div className="fill-item-td" key={fillItem}>
                                                                                                //         </div>
                                                                                                //     )
                                                                                                // }
                                                                                                return (
                                                                                                    <div className="fill-item-td" key={fillItem}>
                                                                                                        <span>[</span>
                                                                                                        <span>{fillItem}</span>
                                                                                                        <span>]</span>
                                                                                                    </div>
                                                                                                )
                                                                                            })
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })
                                                                    }
                                                                </div>
                                                            }
                                                        </div>}
                                                    </div>
                                                </div>
                                            }

                                            <div className="answer-sheet-content">
                                                {
                                                    pageData.map((item, _index) => {
                                                        return (
                                                            <div className="question-out-wrapper" key={_index}>
                                                                {item.title &&
                                                                    <div className="question-title" style={item.title === '选做题' ? { lineHeight: '19px' } : {}}>
                                                                        {`${numberToChinese(item.NO)}、` + item.showTitle}
                                                                        {item.title === '选做题' && ' 请考生用2B铅笔将所选题目对应题号涂黑，答题区域只允许选择一题，如果多做，则按所选做的第一题计分。'}
                                                                        <div className="operation-div">
                                                                            {(item.type == 'Completion' || item.type == 'Single' || item.type == 'Multiple' || item.type == 'Judgment' || item.type == 'Article') &&
                                                                                <>
                                                                                    {item.type == 'Completion' ?
                                                                                        <span style={{ color: '#999999', fontSize: '12px' }}>每行展示空格数：</span>
                                                                                        :
                                                                                        item.type == 'Article' ?
                                                                                            <span style={{ color: '#999999', fontSize: '12px' }}> {item.showNum === 2 ? '总' : '内容行数：'} </span>
                                                                                            :
                                                                                            <span style={{ color: '#999999', fontSize: '12px' }}>每组题目数：</span>
                                                                                    }
                                                                                    {item.type == 'Article' && item.showNum === 2 ? '' : <Input
                                                                                        maxLength={2}
                                                                                        type="number"
                                                                                        style={{ margin: '0 3px' }}
                                                                                        value={item.type == 'Article' ?
                                                                                            (item['list'][0]['originOptionNum'] || item['list'][0]['optionNum'])
                                                                                            :
                                                                                            item.showNum
                                                                                        }
                                                                                        onChange={(e) => { inputChange_9(e, item.NO - 1, item.type) }}
                                                                                    ></Input>}

                                                                                    {item.type == 'Article' && item.showNum === 2 && <>
                                                                                        <Input
                                                                                            maxLength={2}
                                                                                            type="number"
                                                                                            style={{ margin: '0 3px', width: '70px' }}
                                                                                            value={
                                                                                                item['list'][0]['QuesExtraParam'] ? item['list'][0]['QuesExtraParam'].split('%')[0] : ''
                                                                                            }
                                                                                            onChange={(e) => { inputChangeQuesExtraParam(e, item.NO - 1, item['list'][0]['QuesExtraParam'].split('%')[1], 1) }}
                                                                                        ></Input>
                                                                                        <span style={{ color: '#999999', fontSize: '12px' }}>字，在
                                                                                            <Input
                                                                                                maxLength={2}
                                                                                                type="number"
                                                                                                style={{ margin: '0 3px', width: '70px' }}
                                                                                                value={
                                                                                                    item['list'][0]['QuesExtraParam'] ? item['list'][0]['QuesExtraParam'].split('%')[1] : ''

                                                                                                }
                                                                                                onChange={(e) => { inputChangeQuesExtraParam(e, item.NO - 1, item['list'][0]['QuesExtraParam'].split('%')[0]) }}
                                                                                            ></Input>
                                                                                            字处标识
                                                                                        </span>
                                                                                    </>}
                                                                                </>
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                }
                                                                <div
                                                                    className={item.type == 'Answer' || item.type == 'Other' || item.type === 'OptionalQues' || item.type == 'Comprehensive' ? "no-padding question-list-wrapper" : "question-list-wrapper"}
                                                                    data-questype={item.type}
                                                                    data-startindex={item.startIndex}
                                                                    style={item.type == 'Article' ? { padding: '0px 15px' } : {}}
                                                                >
                                                                    {item.type === 'Answer' || item.type === 'Other' || item.type === 'OptionalQues' ? <div>
                                                                        <div className="answer-question-wrapper">
                                                                            {
                                                                                item.list.map((it, id) => {
                                                                                    return (
                                                                                        <div
                                                                                            className="answer-question-item"
                                                                                            style={{ height: it.optionNum * 30 + 'px' }}
                                                                                            key={id}
                                                                                            data-no={it.QuesNO}
                                                                                        >


                                                                                            {!it.hiddenNo && item.type === 'OptionalQues' ? <span id="OptionalQues-ChooseQues">
                                                                                                {GetChooseQuesHtmlFN(item)}
                                                                                            </span> : !it.hiddenNo && <span style={{ position: 'relative', 'zIndex': '1' }}>{it.QuesNO}、{it.score != 0 ? `(${it.score}分)` : ''}</span>}
                                                                                            {it.AnswerImage && it.AnswerImage.ImagePath &&
                                                                                                <Tooltip placement="left"
                                                                                                    // visible={true}
                                                                                                    getPopupContainer={trigger => trigger.parentNode.parentNode}
                                                                                                    // trigger={'click'}
                                                                                                    overlayClassName={"ShowQuesImage-div"}
                                                                                                    title={<><div className="ShowQuesImage-div-div">
                                                                                                        <p className="ChangeImg ChangeImg1"><span>上下移</span>
                                                                                                            <i onClick={() => { ImgToUpFN(it, index, _index, id) }}></i>
                                                                                                            <i onClick={() => { ImgToDownFN(it, index, _index, id) }}></i>
                                                                                                        </p>
                                                                                                        <p className="ChangeImg ChangeImg2" ><span>左右移</span>
                                                                                                            <i onClick={() => { ImgToLeftFN(it, index, _index, id) }}></i>
                                                                                                            <i onClick={() => { ImgToRightFN(it, index, _index, id) }}></i>
                                                                                                        </p>
                                                                                                        <p className="ChangeImg ChangeImg3" ><span>缩放</span>
                                                                                                            <i onClick={() => { ImgToSmallFN(it, index, _index, id) }}></i>
                                                                                                            <i onClick={() => { ImgToBigFN(it, index, _index, id) }}></i>
                                                                                                        </p>
                                                                                                        <p className="ChangeImg ChangeImg4" ><span>删除</span>
                                                                                                            <i onClick={() => { ImgDelFN(it, index, _index, id) }}></i>

                                                                                                        </p>

                                                                                                    </div> </>}>

                                                                                                    <div className="ShowQuesImage"
                                                                                                        style={{
                                                                                                            width: `${it.AnswerImage.ImageSize.split('%')[0]}px`,
                                                                                                            height: `${it.AnswerImage.ImageSize.split('%')[1]}px`,
                                                                                                            position: 'absolute',
                                                                                                            top: `${it.AnswerImage.ImagePosition.split('%')[1] * 1 === 0 ? (!it.hiddenNo ? '29px' : '0') : it.AnswerImage.ImagePosition.split('%')[1] * 1 === 2 ? 'inherit' : (!it.hiddenNo ? 'calc(50% + 14px)' : '50%')}`,
                                                                                                            bottom: `${it.AnswerImage.ImagePosition.split('%')[1] * 1 === 2 ? '0' : 'inherit'}`,
                                                                                                            left: `${it.AnswerImage.ImagePosition.split('%')[0] * 1 === 0 ? '0' : it.AnswerImage.ImagePosition.split('%')[0] * 1 === 2 ? 'inherit' : '50%'}`,
                                                                                                            right: `${it.AnswerImage.ImagePosition.split('%')[0] * 1 === 2 ? '5px' : 'inherit'}`,
                                                                                                            transform: `translate(${it.AnswerImage.ImagePosition.split('%')[0] * 1 === 1 ? '-50%' : '0'}, ${it.AnswerImage.ImagePosition.split('%')[1] * 1 === 1 ? '-50%' : '0'})`,
                                                                                                            backgroundImage: `url('${JSON.parse(sessionStorage.getItem("PapergradebaseInfo")).ResHttpServerUrl}${it.AnswerImage.ImagePath}')`
                                                                                                        }}
                                                                                                    ></div>
                                                                                                </Tooltip>

                                                                                            }
                                                                                            {changeAnswerHeight && !it.hiddenNo &&
                                                                                                <div className="answer-height-input-div">


                                                                                                    <span className="answer-Pic" onClick={() => { UpLoadFn(it, index, _index, id) }}><i></i>
                                                                                                        {it.AnswerImage && it.AnswerImage.ImagePath ? '重选图片' : '上传图片'}</span>
                                                                                                    <span style={{ marginRight: '2px' }}>高</span>
                                                                                                    <Input
                                                                                                        className="answer-height-input"
                                                                                                        maxLength={2}
                                                                                                        type="number"
                                                                                                        defaultValue={it.originOptionNum || it.optionNum}
                                                                                                        onBlur={(e) => { changeAnswerHeight(e, item.NO - 1, it.quesIndex, id) }}
                                                                                                        onPressEnter={(e) => { changeAnswerHeight(e, item.NO - 1, it.quesIndex, id) }}
                                                                                                    ></Input>
                                                                                                    <span> 行</span>
                                                                                                </div>
                                                                                            }
                                                                                        </div>
                                                                                    )
                                                                                })
                                                                            }
                                                                        </div>
                                                                    </div> : item.type === 'Completion' ? GetComletionFN(item, form.SheetLayout, form.QuesSortType, changeAnswerHeight, showPageDataList, index, _index) : renderQuestion(item, form.SheetLayout, form.QuesSortType, changeAnswerHeight, showPageDataList, index)}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </div>
                                        {hasFooter &&
                                            <div className="page-footer">
                                                <div className="page-index">
                                                    <span>第{index + 1}页</span>
                                                    <span>共{showPageDataList.length}页</span>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                )
                            })
                        }
                    </Scrollbars>
                    <form ref={FameRef} id="formData" style={{ display: "none" }}>
                        <input ref={dateRef} type="file" id="files" maxLength={1} onChange={(e) => { ChangeFileList(e) }} ></input>
                    </form>
                </div>

                {/* 右侧菜单 */}
                <div className="answer-menu-div" id="answer-menu-div">
                    <div className="menu-tab-wrapper">
                        <div className="tab-pane">
                            {/* <div className="tab-pane-title-div">
                                <div className={tabIndex == 0 ? "tab-item active" : "tab-item"} onClick={()=>{toggleTab(0)}}>基本信息设置</div>
                                <div className={tabIndex == 1 ? "tab-item active" : "tab-item"} onClick={()=>{toggleTab(1)}}>答案及分值设置</div>
                                <span className="split-line"></span>
                                <Tooltip
                                    title={
                                        <div className="progress-tip-div" id="progress-tip-div" tabIndex={1} onBlur={()=>{setProgressTipShow(false)}}>
                                            <div className="top-div">答案及分值设置进度</div>
                                            <Scrollbars autoHeight autoHeightMin={180} autoHeightMax={400}>
                                                <div className="body-div">
                                                        {progressData.progressInfo.length > 0 ?
                                                            progressData.progressInfo.map((data,index)=>{
                                                                return (
                                                                    <div className="list-wrapper" key={index}>
                                                                        <div className="list-title" title={data.title}>{numberToChinese(index+1)}、{data.title}</div>
                                                                        <div className="list-content">
                                                                            {
                                                                                data.progressList.map((item, idx)=>{
                                                                                    return (
                                                                                        <div 
                                                                                            className={item.isFinish?"list-item finish":"list-item"} 
                                                                                            key={idx}
                                                                                            onClick={()=>{scrollToItem(index, idx)}}
                                                                                        >
                                                                                            {item.QuesNO}
                                                                                        </div>
                                                                                    )
                                                                                })
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                            :
                                                            <Empty type="3" title="暂未设置任何题目"></Empty>
                                                        }
                                                </div>
                                            </Scrollbars>
                                            <div className="footer-div">
                                                <span className="finish-desc"><i></i>已完成</span>
                                                <span className="un-finish-desc"><i></i>未完成</span>
                                            </div>
                                        </div>
                                    }
                                    visible={progressTipShow}
                                    overlayInnerStyle={{padding:'0px'}}
                                    getPopupContainer={()=>document.getElementById('answer-menu-div')}
                                    arrowPointAtCenter={true}
                                    trigger={['click']}
                                    placement="bottomRight"
                                    color="#ffffff"
                                >
                                    <div 
                                        className="progress-btn" 
                                        onClick={()=>{
                                            setProgressTipShow(true);
                                            setTimeout(()=>{
                                                document.getElementById('progress-tip-div').focus();
                                            },100)
                                        }}
                                    >
                                    <span className="icon-wrapper"></span></div>
                                </Tooltip>
                            </div> */}
                            {tabIndex == 0 ?
                                <div className="tab-pane-1">
                                    <div className="menu-option">
                                        <div className="menu-option-title">适用<span>{userInfo.ISUniversity == 1 ? '课程' : '学科'}及</span>年级</div>
                                        <div className="menu-option-content">
                                            <div className="drop-down-wrapper">
                                                {(!(getQueryVariable('gradeid') && getQueryVariable('gradeid') != 'false') && getQueryVariable('type') != '5') ?
                                                    <DropDown
                                                        title="年级:"
                                                        height={180}
                                                        width={115}
                                                        dropList={dropList_2}
                                                        dropSelectd={dropSelect_2}
                                                        onChange={dropChange_2}
                                                    ></DropDown>
                                                    :
                                                    <div className="inline-block-div-grade"><div className="label-title">年级：</div><div className="label-content" title={dropSelect_2.title}>{dropSelect_2.title}</div></div>
                                                }
                                                {(!(getQueryVariable('subjectid') && getQueryVariable('subjectid') != 'false') && getQueryVariable('type') != '5') ?
                                                    <DropDown
                                                        title={userInfo.ISUniversity == 1 ? '课程:' : '学科:'}
                                                        height={180}
                                                        width={105}
                                                        dropList={dropList_1}
                                                        dropSelectd={dropSelect_1}
                                                        onChange={dropChange_1}
                                                    ></DropDown>
                                                    :
                                                    <div className="inline-block-div-subject"><div className="label-title">学科：</div><div className="label-content" title={dropSelect_1.title}>{dropSelect_1.title}</div></div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="menu-option">
                                        <div className="menu-option-title">答题卡名称</div>
                                        <div className="menu-option-content" style={{ paddingLeft: '10px' }}>
                                            <Input
                                                placeholder="请输入答题卡名称"
                                                value={form.Title}
                                                size={30}
                                                onChange={inputChange_1}
                                                onBlur={inputBlur_1}
                                                ref={(el) => { inputRef_1.current = el }}
                                            ></Input>
                                        </div>
                                    </div>
                                    <div className="menu-option">
                                        <div className="menu-option-title">选择答题卡布局</div>
                                        <div className="menu-option-content">
                                            <div className="choose-card-display-div">
                                                <div className="display-card-wrapper">
                                                    <div className={form.SheetLayout == 1 ? "display-card-A4 active" : "display-card-A4"} onClick={() => { changeCardDisply(1) }}>
                                                        <div className="content-desc">
                                                            <div className="col-1"></div>
                                                            <div className="col-2"></div>
                                                            <div className="col-3"></div>
                                                            <div className="col-4"></div>
                                                            <div className="col-5"></div>
                                                        </div>
                                                    </div>
                                                    <div className={form.SheetLayout == 2 ? "display-card-A3 active" : "display-card-A3"} onClick={() => { changeCardDisply(2) }}>
                                                        <div className="content-desc">
                                                            <div className="col-1"></div>
                                                            <div className="col-2"></div>
                                                            <div className="col-3"></div>
                                                            <div className="col-4"></div>
                                                            <div className="col-5"></div>
                                                        </div>
                                                        <div className="content-desc">
                                                            <div className="col-1"></div>
                                                            <div className="col-2"></div>
                                                            <div className="col-3"></div>
                                                            <div className="col-4"></div>
                                                            <div className="col-5"></div>
                                                        </div>
                                                    </div>
                                                    <div className={form.SheetLayout == 3 ? "display-card-A3-3 active" : "display-card-A3-3"} onClick={() => { changeCardDisply(3) }}>
                                                        <div className="content-desc">
                                                            <div className="col-1"></div>
                                                            <div className="col-2"></div>
                                                            <div className="col-3"></div>
                                                            <div className="col-4"></div>
                                                            <div className="col-5"></div>
                                                        </div>
                                                        <div className="content-desc">
                                                            <div className="col-1"></div>
                                                            <div className="col-2"></div>
                                                            <div className="col-3"></div>
                                                            <div className="col-4"></div>
                                                            <div className="col-5"></div>
                                                        </div>
                                                        <div className="content-desc">
                                                            <div className="col-1"></div>
                                                            <div className="col-2"></div>
                                                            <div className="col-3"></div>
                                                            <div className="col-4"></div>
                                                            <div className="col-5"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={form.SheetLayout == 1 ? "tips-text" : form.SheetLayout == 2 ? "tips-text arrow-center" : "tips-text arrow-right"}>
                                                    {form.SheetLayout == 1 && <span>一栏样式适用于A4、B5纸张</span>}
                                                    {form.SheetLayout == 2 && <span>两栏样式适用于A3、B4纸张</span>}
                                                    {form.SheetLayout == 3 && <span>三栏样式适用于A3、B4纸张</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="menu-option">
                                        <div className="menu-option-title">基础信息设置</div>
                                        <div className="menu-option-content" style={{ padding: '12px 0 12px 10px', background: 'rgba(0, 153, 255, 0.06)' }}>
                                            <div className="basic-info-setup-item">
                                                <span style={{ textAlign: 'right', textAlignLast: 'unset' }}>考号提供方式:</span>
                                                {/* <div className="TicketNOProvideType">
                                                    {TicketNOProvideTypeObj.List.map((item) => {
                                                        return <span onClick={}><i></i>{item.title}</span>
                                                    })}
                                                </div> */}
                                                <Checkbox.Group
                                                    options={[
                                                        { title: '手工填涂', label: '手工填涂', value: '1' },
                                                        { title: '条形码', label: '条形码', value: '2' },
                                                        { title: '二维码', label: '二维码', value: '3' }
                                                    ]}
                                                    value={form.TicketNOProvideType.split(',')}
                                                    onChange={(value) => {
                                                        if (value.length == 0) {
                                                            showAlert({
                                                                title: '至少保留一种准考证号提供方式',
                                                                alertShow: true,
                                                                type: 'warn'
                                                            })
                                                            return;
                                                        }
                                                        // console.log(value);
                                                        if (value.length === 3 || (value.length === 2 && value.every((item) => { return item !== '1' }))) {
                                                            form.TicketNOProvideType.split(',').map((item, idx) => {
                                                                if (item !== '1') {
                                                                    value.map((it, idx) => {
                                                                        if (it === item) {
                                                                            value.splice(idx, 1)
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                        dispatchForm({
                                                            type: 'setForm',
                                                            data: { TicketNOProvideType: value.join(',') }
                                                        })
                                                    }}
                                                >
                                                </Checkbox.Group>
                                            </div>
                                            <div className="basic-info-setup-item">
                                                <span>是否区分AB卷:</span>
                                                <Radio.Group
                                                    className="diff-paper-radio"
                                                    options={[
                                                        { title: '是', label: '是', value: 1 },
                                                        { title: '否', label: '否', value: 0 },
                                                    ]}
                                                    value={form.IsIncludeAB}
                                                    onChange={(e) => {
                                                        dispatchForm({
                                                            type: 'setForm',
                                                            data: { IsIncludeAB: e.target.value }
                                                        })
                                                    }}
                                                >
                                                </Radio.Group>
                                            </div>
                                            <div className="basic-info-setup-item">
                                                <span>客观题排列:</span>
                                                <Radio.Group
                                                    options={[
                                                        { title: '横排', label: '横排', value: 2 },
                                                        { title: '竖排', label: '竖排', value: 1 }
                                                    ]}
                                                    value={form.QuesSortType}
                                                    onChange={(e) => {
                                                        dispatchForm({
                                                            type: 'setForm',
                                                            data: { QuesSortType: e.target.value }
                                                        })
                                                    }}
                                                >
                                                </Radio.Group>
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div className="menu-option" style={{marginBottom:'16px'}}>
                                        <div className="menu-option-title">添加试题</div>
                                        <div className="menu-option-content">
                                            <div className="question-type-wrapper">
                                                <span className="question-type" onClick={()=>{showAddModal('Single')}}><i></i><i></i>单选题</span>
                                                <span className="question-type" onClick={()=>{showAddModal('Multiple')}}><i></i><i></i>多选题</span>
                                                <span className="question-type" onClick={()=>{showAddModal('Judgment')}}><i></i><i></i>判断题</span>
                                                <span className="question-type" onClick={()=>{showAddModal('Completion')}}><i></i><i></i>填空题</span>
                                                <span className="question-type" onClick={()=>{showAddModal('Answer')}}><i></i><i></i>解答题</span>
                                                <span className="question-type" onClick={()=>{showAddModal('Article')}}><i></i><i></i>作文题</span>
                                            </div>
                                        </div>
                                    </div> */}
                                    <div className="menu-option">
                                        <div className="menu-option-title-2">
                                            <span>试题列表{GetAllSorceFN(form.questionListData)}</span>
                                            <span className="question-type" onClick={() => { showAddModal('Single') }}><i></i><i></i>添加试题</span>
                                        </div>
                                        <div className="menu-option-content">
                                            <div className="question-list-info">
                                                {form.questionListData.length > 0 &&
                                                    form.questionListData.map((item, index) => {
                                                        return (
                                                            <div className="info-item-li" key={index}>
                                                                <span className="title" title={item.title}>{numberToChinese(index + 1)}、{item.title}</span>
                                                                <span className="count">{item.startIndex}-{item.endIndex}</span>
                                                                <div className="operation-btn-wrapper">
                                                                    {index != 0 && <span className="up-btn" onClick={() => { changeIndex('up', index) }}></span>}
                                                                    {index != form.questionListData.length - 1 && <span className="down-btn" onClick={() => { changeIndex('down', index) }}></span>}
                                                                    <span className="edit-btn" onClick={() => { showAddModal(item.type, item, index) }}></span>
                                                                    <span className="delete-btn" onClick={() => { deleteQuestion(index) }}></span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </div>
                                        {form.questionListData.length == 0 && <Empty type="3" title="暂未设置任何题目"></Empty>}
                                    </div>
                                    {/* <div className="menu-option">
                                        <div className="menu-option-title has-footer-option">
                                            <span>添加页脚</span>
                                            <Switch checked={hasFooter} defaultChecked={true} onChange={(checked)=>{setHasFooter(checked)}}></Switch>
                                        </div>
                                    </div> */}
                                </div>
                                :
                                <div className="tab-pane-2">
                                    <div className="tips-div">已设置分值之和：<span style={{ color: '#009900' }}>{TotalScore}</span>分</div>
                                    <Scrollbars
                                        autoHeight
                                        autoHeightMax={'calc(1060px - 182px)'}
                                        ref={(el) => { ScoreScrollRef.current = el }}
                                    >
                                        <div className="question-answer-setup-wrapper" ref={(el) => { ScoreWrapperRef.current = el }}>
                                            {form.questionListData.length > 0 ?
                                                form.questionListData.map((item, index) => {
                                                    return (
                                                        <div className="question-setup-group" key={index}>
                                                            <div className="question-item-title">
                                                                <span title={item.title}>{numberToChinese(index + 1) + '、' + item.title}</span>
                                                                {(item.type == 'Single' || item.type == 'Multiple' || item.type == 'Judgment' || item.type == 'Completion' || item.type == 'Answer' || item.type == 'Other' || item.type == 'OptionalQues') &&
                                                                    <span
                                                                        className="set-all-btn"
                                                                        onClick={() => { showAnswerSetupModal(item, index) }}
                                                                    >批量设置</span>
                                                                }
                                                            </div>
                                                            <div className="setup-group-wrapper">
                                                                {
                                                                    item.list.map((question, _index) => {
                                                                        if (item.type == 'Completion' && question.children && question.children.length > 0) {
                                                                            return (
                                                                                <div className="question-setup-item" key={_index}>
                                                                                    <div className="question-setup-item-score">
                                                                                        <span className="left-index">{question.QuesNO}、</span>
                                                                                        <div className="left-wrapper">
                                                                                            {question.children.map((child, idx) => {
                                                                                                return (
                                                                                                    <div className="left-content" key={idx}>
                                                                                                        <span>({idx + 1})&nbsp;</span>
                                                                                                        <div className="options-wrapper">
                                                                                                            {renderQuestionOptions(item.type, question)}
                                                                                                        </div>
                                                                                                        <div className="score-input-wrapper">
                                                                                                            <Input
                                                                                                                maxLength={3}
                                                                                                                type="number"
                                                                                                                className="score-input"
                                                                                                                value={child.score}
                                                                                                                onChange={(e) => {
                                                                                                                    if (e.target.value.length > 3) {
                                                                                                                        return;
                                                                                                                    }
                                                                                                                    let value = e.target.value == '' ? 0 : e.target.value;
                                                                                                                    questionScoreChange(value, index, _index, idx);
                                                                                                                }}
                                                                                                                onBlur={() => {
                                                                                                                    questionScoreChange(parseFloat(child.score), index, _index, idx);
                                                                                                                }}
                                                                                                            >
                                                                                                            </Input>
                                                                                                            <span>分</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        }
                                                                        return (
                                                                            <div className={redTipsShow && progressData.unFinishNOList.includes(question.QuesNO) ? "question-setup-item unset-tip" : "question-setup-item"} key={_index}>
                                                                                <div className="question-setup-item-score">
                                                                                    <span>{question.QuesNO}、</span>
                                                                                    <div className="options-wrapper">
                                                                                        {renderQuestionOptions(item.type, question, index, _index)}
                                                                                    </div>
                                                                                    <div className="score-input-wrapper">
                                                                                        <Input
                                                                                            maxLength={3}
                                                                                            type="number"
                                                                                            className={"score-input"}
                                                                                            value={question.score}
                                                                                            onChange={(e) => {
                                                                                                if (e.target.value.length > 3) {
                                                                                                    return;
                                                                                                }
                                                                                                let value = e.target.value == '' ? 0 : e.target.value;
                                                                                                questionScoreChange(value, index, _index);
                                                                                            }}
                                                                                            onBlur={() => {
                                                                                                questionScoreChange(parseFloat(question.score), index, _index);
                                                                                            }}
                                                                                        >
                                                                                        </Input>
                                                                                        <span>分</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                                :
                                                <Empty type="3" title="暂未设置任何题目"></Empty>
                                            }
                                        </div>
                                    </Scrollbars>
                                </div>
                            }
                        </div>
                        <div className="fixed-btn-wrapper">
                            <span className="btn-style-2-green" onClick={previewCard}>预览</span>
                            <span className="btn-style-2-blue" onClick={savaAnswerSheet}>完成</span>
                        </div>
                    </div>
                </div>

                {/* 准考证位数设置 */}
                <Modal
                    title="设置准考证号长度"
                    type="1"
                    visible={modalShow_1}
                    bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    className="admission-edit-modal"
                    onOk={confirmSetLength}
                    onCancel={
                        () => {
                            setModalShow_1(false);
                            setinputValue_2('');
                        }
                    }
                >
                    <div className="content-wrapper">
                        <label>准考证号长度：</label>
                        <Input
                            maxLength={2}
                            type="number"
                            placeholder={"请输入6~12之间的数字"}
                            value={inputValue_2}
                            onChange={inputChange_2}
                        ></Input>
                    </div>
                    <Alert
                        type={alertConfig.type}
                        title={alertConfig.title}
                        show={alertConfig.alertShow && modalShow_1}
                        onClose={alertConfig.onCancel}
                        onCancel={alertConfig.onCancel}
                        onHide={alertConfig.onHide}
                        onOk={alertConfig.onOk}
                    >
                    </Alert>
                </Modal>

                {/* 添加、设置题目 */}
                <Modal
                    type="1"
                    bodyStyle={
                        {
                            height: `${(questionForm.type == 'Single' || questionForm.type == 'Multiple' || questionForm.type == 'Completion') && questionForm.list.length != 0
                                ?
                                (220 + (questionForm.list.length < 6 ? questionForm.list.length * 35 : 200)) + 'px'
                                :
                                'auto'
                                }`,
                            maxHeight: '436px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '24px 32px',
                            width: "560px",
                        }
                    }
                    className={questionForm.type == 'Judgment' || questionForm.type == 'Article' ? "add-question-modal " : "add-question-modal"}
                    title={modalConfig.title}
                    visible={modalConfig.modalShow}
                    onOk={modalConfig.onOk}
                    onCancel={modalConfig.onCancel}
                >
                    <div className="option-content-wrapper">
                        <div className="question-form-type" style={{ marginBottom: '16px' }}>
                            <DropDown
                                title="题目类型："
                                height={180}
                                width={240}
                                dropList={quesTypeDropList}
                                dropSelectd={selQuestionType}
                                onChange={toggleQuestionType}
                            >
                            </DropDown>
                        </div>
                        <div className="question-form-title">
                            <label>题目名称：</label>
                            <Input
                                maxLength={30}
                                type="text"
                                ref={(el) => { inputRef_3.current = el }}
                                value={questionForm.title}
                                onChange={inputChange_3}
                                onBlur={inputBlur_3}
                            ></Input>
                        </div>
                        {/* {modalConfig.data.type === 'Judgment' && <div style={{ marginTop: '16px' }}>
                            <label>展示方式：</label>
                            <Radio.Group
                                options={[
                                    { label: 'T/F', value: '2' },
                                    { label: '√/×', value: '1' },
                                ]}
                                value={questionForm.QuesGroupExtraParam}
                                onChange={(e) => {
                                    dispatchQuestionForm({
                                        type: 'setForm',
                                        data: {
                                            QuesGroupExtraParam: e.target.value
                                        }
                                    })
                                }}
                            ></Radio.Group>
                        </div>} */}
                        <div className="question-form-options" style={modalConfig.data.type == 'Article' || modalConfig.data.type == 'OptionalQues' ? { paddingLeft: '0px' } : {}}>
                            {modalConfig.data.type != 'Article' && modalConfig.data.type != 'OptionalQues' &&
                                <>
                                    <span style={{ marginRight: '5px' }}>从</span>
                                    <Input
                                        maxLength={3}
                                        type="number"
                                        // disabled={true}
                                        value={inputValue_4}
                                        onBlur={inputBlur_4}
                                        onChange={inputChange_4}
                                    ></Input>
                                    <span style={{ margin: '0px 5px' }}>题到</span>
                                    <Input
                                        maxLength={3}
                                        type="number"
                                        value={inputValue_5}
                                        onBlur={inputBlur_5}
                                        onChange={inputChange_5}
                                    ></Input>
                                    <span style={{ margin: '0px 5px' }}>题</span>
                                </>

                            }
                            {modalConfig.data.type == 'Multiple' ? <> <span style={{ margin: '0px 5px' }}>，少选得</span>
                                <Input
                                    max={100}
                                    min={0}
                                    type="number"
                                    value={questionForm.ScoreRule}
                                    onChange={inputChange_ScoreRule}
                                // disabled={modalConfig.data.type == 'Judgment' ? true : false}
                                ></Input>
                                <span style={{ margin: '0px 5px' }}>分</span>
                            </> : ''}

                        </div>
                        <div className="question-form-options question-form-options1">
                            {modalConfig.data.type != 'Judgment' && modalConfig.data.type != 'Article' && modalConfig.data.type != 'Answer' && modalConfig.data.type != 'Other' && modalConfig.data.type != 'OptionalQues' &&
                                <>
                                    <span style={{ margin: '0px 5px' }}>每题</span>
                                    <Input
                                        maxLength={1}
                                        type="number"
                                        value={questionForm.optionNum}
                                        onChange={inputChange_6}
                                        disabled={modalConfig.data.type == 'Judgment' ? true : false}
                                    ></Input>
                                </>
                            }
                            {/* {modalConfig.data.type == 'Article' &&
                                <>
                                    <span>内容行数：</span>
                                    <Input
                                        maxLength={2}
                                        type="number"
                                        value={questionForm.list.length>0?questionForm.list[0].optionNum:15}
                                        onChange={inputChange_7}
                                        disabled={modalConfig.data.type=='Judgment'?true:false}
                                    ></Input>
                                </>
                            } */}
                            {(modalConfig.data.type == 'Single' || modalConfig.data.type == 'Multiple') &&
                                <span style={{ marginLeft: '5px' }}>个选项，</span>
                            }
                            {/* {modalConfig.data.type == 'Judgment' &&
                                <span style={{ marginLeft: '5px' }}>题，</span>
                            } */}
                            {modalConfig.data.type == 'Completion' && <span style={{ marginLeft: '5px' }}>空，</span>}
                            {modalConfig.data.type !== 'Article' && modalConfig.data.type !== 'OptionalQues' &&
                                <>
                                    <span>每小题</span>
                                    <Input
                                        maxLength={3}
                                        type="number"
                                        style={{ margin: '0px 5px' }}
                                        value={questionForm.score}
                                        onChange={(e) => {
                                            if (e.target.value.length > 3) {
                                                return;
                                            }
                                            let value = e.target.value == '' ? 0 : e.target.value;
                                            questionScoreChangeAll(value);
                                        }}
                                    ></Input>
                                    <span>分</span>
                                </>
                            }
                        </div>
                        {questionForm.type == 'OptionalQues' &&
                            <>
                                <div>
                                    <label>选做类型：</label>
                                    <Radio.Group
                                        options={[
                                            { label: '二选一', value: '2%1' },
                                            { label: '三选一', value: '3%1' },
                                            { label: '四选一', value: '4%1' }
                                        ]}
                                        value={questionForm.AnswerModel}
                                        onChange={(e) => {
                                            dispatchQuestionForm({
                                                type: 'setForm',
                                                data: {
                                                    AnswerModel: e.target.value
                                                }
                                            })
                                        }}
                                    ></Radio.Group>
                                </div>
                                <div className="question-form-options question-form-options1">
                                    <label>题目分数：</label>
                                    <Input
                                        maxLength={3}
                                        type="number"
                                        style={{ margin: '0px 5px' }}
                                        value={questionForm.score}
                                        onChange={(e) => {
                                            if (e.target.value.length > 3) {
                                                return;
                                            }
                                            let value = e.target.value == '' ? 0 : e.target.value;
                                            questionScoreChangeAll(value);
                                        }}
                                    ></Input>
                                    <span style={{ marginLeft: '5px' }}>分</span>
                                </div>
                            </>
                        }
                        {questionForm.type == 'Article' &&
                            <>
                                <div>
                                    <label>作文类型：</label>
                                    <Radio.Group
                                        options={[
                                            { label: '外语', value: 1 },
                                            { label: '语文', value: 2 }
                                        ]}
                                        value={questionForm.showNum}
                                        onChange={(e) => {
                                            dispatchQuestionForm({
                                                type: 'setForm',
                                                data: {
                                                    showNum: e.target.value
                                                }
                                            })
                                        }}
                                    ></Radio.Group>
                                </div>
                                {/* {questionForm.showNum == 2 && <div className="question-form-workCount">
                                    <label>字数设置：</label>
                                    <span>共  <Input
                                        maxLength={3}
                                        type="number"
                                        value={questionForm.list.length > 0 ? questionForm.list[0]['score'] : questionForm.score}
                                        onChange={(e) => {
                                            if (e.target.value.length > 3) {
                                                return;
                                            }
                                            let value = e.target.value == '' ? 0 : e.target.value;
                                            questionScoreChange(value, 0);
                                        }}
                                        onBlur={() => {
                                            questionScoreChange(parseFloat(questionForm.list.length > 0 ? questionForm.list[0]['score'] : questionForm.score), 0);
                                        }}
                                    ></Input>字，在 <Input
                                        maxLength={3}
                                        type="number"
                                        value={questionForm.list.length > 0 ? questionForm.list[0]['score'] : questionForm.score}
                                        onChange={(e) => {
                                            if (e.target.value.length > 3) {
                                                return;
                                            }
                                            let value = e.target.value == '' ? 0 : e.target.value;
                                            questionScoreChange(value, 0);
                                        }}
                                        onBlur={() => {
                                            questionScoreChange(parseFloat(questionForm.list.length > 0 ? questionForm.list[0]['score'] : questionForm.score), 0);
                                        }}
                                    ></Input>字处标识</span>
                                </div>} */}
                                <div className="question-form-options question-form-options1">
                                    <label>题目分数：</label>
                                    <Input
                                        maxLength={3}
                                        type="number"
                                        value={questionForm.list.length > 0 ? questionForm.list[0]['score'] : questionForm.score}
                                        onChange={(e) => {
                                            if (e.target.value.length > 3) {
                                                return;
                                            }
                                            let value = e.target.value == '' ? 0 : e.target.value;
                                            questionScoreChange(value, 0);
                                        }}
                                        onBlur={() => {
                                            questionScoreChange(parseFloat(questionForm.list.length > 0 ? questionForm.list[0]['score'] : questionForm.score), 0);
                                        }}
                                    ></Input>
                                    <span style={{ marginLeft: '5px' }}>分</span>
                                </div>
                            </>
                        }
                        {questionForm.list.length > 0 && (questionForm.type == 'Single' || questionForm.type == 'Multiple' || questionForm.type == 'Completion' || questionForm.type == 'Judgment' || questionForm.type == 'Answer' || questionForm.type == 'Other') &&
                            <div className="question-item-setup-wrapper">
                                <Scrollbars autoHeight autoHeightMax={198}>
                                    <div className="question-list-div">
                                        {(questionForm.type == 'Single' || questionForm.type == 'Multiple' || questionForm.type == 'Judgment' || questionForm.type == 'Answer' || questionForm.type == 'Other' || questionForm.type == 'OptionalQues') &&
                                            questionForm.list.map((item, index) => {
                                                return (
                                                    <div className="single-question-item" key={index}>
                                                        <span className="no">{parseInt(questionForm.startIndex) + index}.</span>
                                                        {/* {questionForm.type=='Answer' && <span style={{marginRight:'6px'}}>高</span>} */}
                                                        {questionForm.type != 'Answer' && questionForm.type != 'Other' && questionForm.type != 'OptionalQues' &&
                                                            <Input
                                                                maxLength={1}
                                                                type="number"
                                                                disabled={questionForm.type == 'Judgment' ? true : false}
                                                                value={item.optionNum}
                                                                onChange={(e) => { inputChange_8(e, index, questionForm.type) }}
                                                            ></Input>
                                                        }
                                                        {questionForm.type != 'Answer' && questionForm.type != 'Other' && questionForm.type != 'OptionalQues' &&
                                                            <span>个选项，</span>
                                                        }
                                                        <Input
                                                            maxLength={3}
                                                            type="number"
                                                            value={item.score}
                                                            onChange={(e) => {
                                                                if (e.target.value.length > 3) {
                                                                    return;
                                                                }
                                                                let value = e.target.value == '' ? 0 : e.target.value;
                                                                questionScoreChange(value, index);
                                                            }}
                                                            onBlur={() => {
                                                                questionScoreChange(parseFloat(item.score), index);
                                                            }}
                                                        ></Input>
                                                        <span>分</span>
                                                    </div>
                                                )
                                            })
                                        }
                                        {questionForm.type == 'Completion' &&
                                            questionForm.list.map((item, index) => {
                                                return (
                                                    <div className="completion-question-item" key={index}>
                                                        <div className="completion-question-item-header">
                                                            <div>
                                                                <span className="no">{parseInt(questionForm.startIndex) + index}.</span>
                                                                {(!item.children || item.children.length == 0) &&
                                                                    <>
                                                                        <span>共</span>
                                                                        <Input
                                                                            maxLength={1}
                                                                            type="number"
                                                                            value={item.optionNum}
                                                                            onChange={(e) => { inputChange_8(e, index, questionForm.type) }}
                                                                        ></Input>
                                                                        <span>空，</span>
                                                                        <Input
                                                                            maxLength={3}
                                                                            type="number"
                                                                            value={item.score}
                                                                            onChange={(e) => {
                                                                                if (e.target.value.length > 3) {
                                                                                    return;
                                                                                }
                                                                                let value = e.target.value == '' ? 0 : e.target.value;
                                                                                questionScoreChange(value, index);
                                                                            }}
                                                                            onBlur={() => {
                                                                                questionScoreChange(parseFloat(item.score), index);
                                                                            }}
                                                                        ></Input>
                                                                        <span>分</span>
                                                                    </>
                                                                }
                                                            </div>
                                                            {/* <div className="btn-wrapper">
                                                                <span className="add-btn" onClick={()=>{addCompletionItem(index)}}></span>
                                                                <span className="delete-btn" onClick={()=>{deleteCompletionItem(index)}}></span>
                                                            </div> */}
                                                        </div>
                                                        {item.children && item.children.length > 0 &&
                                                            <div className="completion-question-item-body">
                                                                {
                                                                    item.children.map((childItem, _index) => {
                                                                        return (
                                                                            <div className="child-item" key={_index}>
                                                                                <div>
                                                                                    <span className="no">({parseInt(questionForm.startIndex) + _index})</span>
                                                                                    <span style={{ margin: '6px' }}>共</span>
                                                                                    <Input
                                                                                        maxLength={1}
                                                                                        type="number"
                                                                                        value={childItem.optionNum}
                                                                                        onChange={(e) => { inputChange_8(e, index, questionForm.type, _index) }}
                                                                                    ></Input>
                                                                                    <span>空</span>
                                                                                </div>
                                                                                <div className="btn-wrapper">
                                                                                    <span className="delete-btn" onClick={() => { deleteCompletionChildItem(index, _index) }}></span>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        }
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </Scrollbars>
                            </div>
                        }
                    </div>
                    <Alert
                        type={alertConfig.type}
                        title={alertConfig.title}
                        show={alertConfig.alertShow && modalConfig.modalShow}
                        onClose={alertConfig.onCancel}
                        onCancel={alertConfig.onCancel}
                        onHide={alertConfig.onHide}
                        onOk={alertConfig.onOk}
                    >
                    </Alert>
                </Modal>

                {/* 批量设置分值答案 */}
                <Modal
                    title={modalConfig2.title}
                    type="1"
                    visible={modalConfig2.modalShow}
                    bodyStyle={{
                        height: modalConfig2.bodyHeight,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '24px 0px'
                    }}
                    className={modalConfig2.data.questionType == 'Completion' || modalConfig2.data.questionType == 'Answer' || modalConfig2.data.questionType == 'Other' || modalConfig2.data.questionType == 'OptionalQues' ? "small-width setup-score-modal" : "setup-score-modal"}
                    onOk={modalConfig2.onOk}
                    onCancel={modalConfig2.onCancel}
                >
                    <Scrollbars autoHeight autoHeightMax={400}>
                        <div className="content-wrapper">
                            <div className="row-1">
                                <label>分数:</label>
                                <Input
                                    maxLength={3}
                                    type="number"
                                    value={scoreValue}
                                    onChange={
                                        (e) => {
                                            if (e.target.value.length > 3) {
                                                return
                                            }
                                            let value = e.target.value == '' ? 0 : e.target.value;
                                            setScoreValue(value);
                                        }
                                    }
                                ></Input>
                                <span>分 ×{modalConfig2.data.questionLength}题</span>
                            </div>

                            {modalConfig2.data.questionType != 'Completion' && modalConfig2.data.questionType != 'Answer' && modalConfig2.data.questionType != 'Other' && modalConfig2.data.questionType != 'OptionalQues' &&
                                <>
                                    <div className="row-3">
                                        {modalConfig2.data.questionType == 'Multiple' ?
                                            <span>请按顺序填入答案每道题以"|"分隔</span>
                                            :
                                            <span>请按顺序填入答案</span>
                                        }
                                        {modalConfig2.data.questionType == 'Single' &&
                                            <span>，如ABCDA...</span>
                                        }
                                        {modalConfig2.data.questionType == 'Multiple' &&
                                            <span>，如AB|AD|CD|ABC|D...</span>
                                        }
                                        {modalConfig2.data.questionType == 'Judgment' &&
                                            <span>，如TTTFF...</span>
                                        }
                                    </div>
                                    {modalConfig2.data.questionType &&
                                        <div className="answer-setup-wrapper">
                                            {filterArrByGroup((new Array(modalConfig2.data.questionLength)).fill(''), 5).map((item, index) => {
                                                return (
                                                    <div className="answer-setup-group" key={index}>
                                                        <label>
                                                            {modalConfig2.data.questionLength % 5 == 1 && index == Math.floor(modalConfig2.data.questionLength / 5) ? <span></span> : <span>第{5 * index + modalConfig2.data.questionStartIndex}-</span>}
                                                            <span>{5 * index + 5 > modalConfig2.data.questionLength ? modalConfig2.data.questionLength + modalConfig2.data.questionStartIndex - 1 : 5 * index + 5 + modalConfig2.data.questionStartIndex - 1}题</span>
                                                        </label>
                                                        <Input
                                                            maxLength={50}
                                                            type="text"
                                                            value={answerInputMap[index] !== undefined ? answerInputMap[index] : ''}
                                                            onChange={(e) => {
                                                                if (e.target.value.length > 50) {
                                                                    return
                                                                }
                                                                answerInputChange(e.target.value, index);
                                                            }}
                                                            onBlur={answerInputBlur}
                                                        ></Input>
                                                        {answerInputValidate.result[index] != undefined && answerInputValidate.result[index] != 2 &&
                                                            <span className={answerInputValidate.result[index] == 1 ? "input-tips-span success" : "input-tips-span"}><i></i></span>
                                                        }
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    }
                                </>
                            }
                        </div>
                    </Scrollbars>
                </Modal>

                <Alert
                    type={alertConfig.type}
                    title={alertConfig.title}
                    show={alertConfig.alertShow && !modalShow_1}
                    onClose={alertConfig.onCancel}
                    onCancel={alertConfig.onCancel}
                    onHide={alertConfig.onHide}
                    onOk={alertConfig.onOk}
                >
                </Alert>
            </div>
        </Loading>
    )
}

export default RootContainer