// @ts-nocheck

import React, { Component, useEffect, useState, useMemo, useReducer, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Scrollbars from 'react-custom-scrollbars';
import { Modal, Alert } from "../../../common/index";
import { Input } from "antd";

import { useStateValue } from "../../../common/js/hooks";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import commonSettingActions from "../actions/commonSettingActions";
import { GetSheetDetail, SaveSheetInPaperMakeSystem, UpdateSheetInPaperMakeSystem, GetTermAndPeriodAndWeekNOInfo } from "../actions/actionApi";
import { getQueryVariable } from "../../../common/js/disconnect";
import $ from 'jquery';
import {
    getOneMmsPx,
    PositionObjTemplate,
    numberToChinese,
    filterArrByGroup,
    cssPagedMedia,
    QuestionTypeMap,
    QuestionTypeMap2,
    dataURLtoFile
} from "../util";
import {
    restructData,
    getPageData,
    getQuestionScoreDesc,
    renderQuestion
} from '../questionRenderMethod';

import "../../scss/card-preview.scss";

const BYTES_PER_SLICE = 1024 * 1024;

function CardPreviw(props) {

    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.commonSetting);

    const userInfoRef = useStateValue(userInfo);

    const initForm = {
        Title: '',
        SheetLayout: 1,    //答题卡布局栏数
        AdmissionNoLength: 6,  //准考证号长度（6~12）
        QuesSortType: 2, //客观题是否竖排展示
        IsIncludeAB: 0,   //存在A、B卷
        TicketNOProvideType: '1',   //考号类型
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

    const [loading, setLoading] = useState(false);

    //学期
    const curTermRef = useRef('');

    //是否需要页脚
    const [hasFooter, setHasFooter] = useState(true);

    const [cardClassName, setCardClassName] = useState('');
    const [QuesStruct, setQuesStruct] = useState([]);
    const QuesStructRef = useStateValue(QuesStruct);
    //每页的展示数据
    const showPageDataList = useMemo(() => {
        let dataList = form.questionListData.map((item, index) => {
            return {
                ...item,
                rowGroupList: restructData(item, item.type, form.SheetLayout),
                NO: index + 1,
                showTitle: item.title + getQuestionScoreDesc(item),
                childQuesGroupList: item.childQuesGroupList ? item.childQuesGroupList.map((childItem) => {
                    return {
                        ...childItem,
                        rowGroupList: restructData(childItem, childItem.type, form.SheetLayout),
                    }
                }) : []
            }
        })
        let pageDataList = [[]];
        let headerHeight = form.TicketNOProvideType.includes('1') && (form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3')) ? 470 : 405;
        if (form.questionListData.length > 0) {
            pageDataList = getPageData(dataList, 0, false, form.QuesSortType, headerHeight).pageDataList;
        }
        console.log(QuesStructRef.current, 131231);
        if (QuesStructRef.current) {
            console.log(QuesStructRef.current, 131231);
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
        }
        if (sessionStorage.getItem('ShowPageDataList')) {
            JSON.parse(sessionStorage.getItem('ShowPageDataList')).map((item, index) => {
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
        }

        return pageDataList;
    }, [form])

    const showPageDataListRef = useStateValue(showPageDataList);

    useEffect(() => {
        if (userInfo.UserID) {
            pageInit();
        }
    }, [userInfo])

    //与组卷系统对接
    useEffect(() => {
        if (getQueryVariable('implant') == '1') {

            let TempAnswerSheetObj = {};

            let windowObj = window.parent || window.opener;

            //组件系统
            window.addEventListener('message', (e) => {
                //初始化答题卡
                if (e.data.EventKey == 'InitAnswerSheet') {
                    setSettingOptionShow(true);
                    let AnswerSheetObj = e.data.AnswerSheetObj;
                    TempAnswerSheetObj = JSON.parse(JSON.stringify(AnswerSheetObj));
                    //处理填空题一题多空分值的情况
                    AnswerSheetObj = {
                        ...AnswerSheetObj,
                        QuesStruct: AnswerSheetObj.QuesStruct.map((item) => {
                            return {
                                ...item,
                                QuesList: item.QuesList.map((quesItem) => {
                                    let QuesScoreSum = typeof quesItem.QuesScore == 'string' ? quesItem.QuesScore.split(',').reduce((preValue, current) => {
                                        return (+preValue) + (+current);
                                    }) : quesItem.QuesScore + '';
                                    return {
                                        ...quesItem,
                                        QuesScore: QuesScoreSum + '',
                                        QuesScoreCopy: quesItem.QuesScore
                                    }
                                })
                            }
                        })
                    }
                    transformCardData(AnswerSheetObj);
                }

                //保存/导出答题卡
                if (e.data.EventKey == 'GenerateAnswerSheet') {
                    let AnswerSheetObj = e.data.AnswerSheetObj;
                    TempAnswerSheetObj = JSON.parse(JSON.stringify(AnswerSheetObj));
                    //处理填空题一题多空分值的情况
                    AnswerSheetObj = {
                        ...AnswerSheetObj,
                        QuesStruct: AnswerSheetObj.QuesStruct.map((item) => {
                            return {
                                ...item,
                                QuesList: item.QuesList.map((quesItem) => {
                                    let QuesScoreSum = typeof quesItem.QuesScore == 'string' ? quesItem.QuesScore.split(',').reduce((preValue, current) => {
                                        return (+preValue) + (+current);
                                    }) : quesItem.QuesScore + '';
                                    return {
                                        ...quesItem,
                                        QuesScore: QuesScoreSum + '',
                                        QuesScoreCopy: quesItem.QuesScore
                                    }
                                })
                            }
                        })
                    }
                    transformCardData(AnswerSheetObj);
                    setTimeout(async () => {
                        let { FileUrl, SheetID } = await uploadAnswerSheet(JSON.parse(JSON.stringify(TempAnswerSheetObj)));
                        windowObj.postMessage({
                            EventKey: 'FinishAnswerSheetMake',
                            FileUrl,
                            SheetID
                        }, '*');
                    }, 100)
                }

                //获取答题卡JSON
                if (e.data.EventKey == 'getAnswerSheetObj') {
                    let newQuesStruct = getCardData()['QuesStruct'];
                    windowObj.postMessage({
                        EventKey: 'transJsonParam',
                        AnswerSheetObj: {
                            ...TempAnswerSheetObj,
                            ...getCardData(),
                            QuesStruct: newQuesStruct.map((item, i) => {
                                return {
                                    ...item,
                                    QuesCount: TempAnswerSheetObj['QuesStruct'][i]['QuesList'].length,
                                    QuesList: TempAnswerSheetObj['QuesStruct'][i]['QuesList']
                                }
                            })
                        }
                    }, '*');
                }
            })

            window.InitAnswerSheet = (AnswerSheetObjStr) => {
                setSettingOptionShow(true);
                let AnswerSheetObj = JSON.parse(JSON.stringify(AnswerSheetObjStr));
                TempAnswerSheetObj = JSON.parse(JSON.stringify(AnswerSheetObjStr));
                //处理填空题一题多空分值的情况
                AnswerSheetObj = {
                    ...AnswerSheetObj,
                    QuesStruct: AnswerSheetObj.QuesStruct.map((item) => {
                        return {
                            ...item,
                            QuesList: item.QuesList.map((quesItem) => {
                                let QuesScoreSum = typeof quesItem.QuesScore == 'string' ? quesItem.QuesScore.split(',').reduce((preValue, current) => {
                                    return (+preValue) + (+current);
                                }) : quesItem.QuesScore + '';
                                return {
                                    ...quesItem,
                                    QuesScore: QuesScoreSum + '',
                                    QuesScoreCopy: quesItem.QuesScore
                                }
                            })
                        }
                    })
                }
                transformCardData(AnswerSheetObj);
            }

            window.GenerateAnswerSheet = (AnswerSheetObjStr) => {
                let AnswerSheetObj = JSON.parse(JSON.stringify(AnswerSheetObjStr));
                TempAnswerSheetObj = JSON.parse(JSON.stringify(AnswerSheetObjStr));
                //处理填空题一题多空分值的情况
                AnswerSheetObj = {
                    ...AnswerSheetObj,
                    QuesStruct: AnswerSheetObj.QuesStruct.map((item) => {
                        return {
                            ...item,
                            QuesList: item.QuesList.map((quesItem) => {
                                let QuesScoreSum = typeof quesItem.QuesScore == 'string' ? quesItem.QuesScore.split(',').reduce((preValue, current) => {
                                    return (+preValue) + (+current);
                                }) : quesItem.QuesScore + '';
                                return {
                                    ...quesItem,
                                    QuesScore: QuesScoreSum + '',
                                    QuesScoreCopy: quesItem.QuesScore
                                }
                            })
                        }
                    })
                }
                transformCardData(AnswerSheetObj);
                setTimeout(async () => {
                    let { FileUrl, SheetID } = await uploadAnswerSheet(JSON.parse(JSON.stringify(TempAnswerSheetObj)));
                    if (window.FinishAnswerSheetMake) {
                        window.FinishAnswerSheetMake(FileUrl, SheetID);
                    }
                }, 100)
            }

            window.transJsonParam = () => {
                let newQuesStruct = getCardData()['QuesStruct'];
                return JSON.stringify({
                    ...TempAnswerSheetObj,
                    ...getCardData(),
                    QuesStruct: newQuesStruct.map((item, i) => {
                        return {
                            ...item,
                            QuesCount: TempAnswerSheetObj['QuesStruct'][i]['QuesList'].length,
                            QuesList: TempAnswerSheetObj['QuesStruct'][i]['QuesList']
                        }
                    })
                })
            }
        }
    }, [])

    const pageInit = async () => {
        if (getQueryVariable('implant') == '1') {
            setSettingOptionShow(true);
        }
        const termInfo = await GetTermAndPeriodAndWeekNOInfo({
            UserID: userInfo.UserID,
            SchoolID: userInfo.SchoolID,
            UserType: userInfo.UserType
        }, dispatch)
        if (termInfo) {
            curTermRef.current = termInfo.ItemTerm.Term;
        }
        switch (getQueryVariable('type')) {
            case '0':
                setCardClassName('preview');
                break;
            case '3':
                setCardClassName('download');
                break;
            case '4':
                setCardClassName('print');
                break;
        }
        if (getQueryVariable('sheetid')) {
            // dispatch(commonSettingActions.appLoadingShow());
            const res = await GetSheetDetail({
                SheetID: getQueryVariable('sheetid'),
                dispatch
            })
            if (res) {

                setQuesStruct(res.QuesStruct);
                setTimeout(() => {
                    transformCardData(res);
                }, 100)
            }
            dispatch(commonSettingActions.appLoadingHide());
            if (getQueryVariable('type') == '3') {
                setTimeout(() => {
                    downLoadCard();
                }, 1000)
            }
            if (getQueryVariable('type') == '4') {
                setTimeout(() => {
                    window.print();
                }, 1000)
            }

            return;
        }
        if (sessionStorage.getItem('CardObj')) {
            let CardObj = JSON.parse(sessionStorage.getItem('CardObj'));
            dispatchForm({
                type: 'setForm',
                data: {
                    ...CardObj
                }
            })
            if (CardObj.SheetLayout == 2) {
                cssPagedMedia('A3 landscape')
            } else {
                cssPagedMedia('A4 portrait')
            }
        }
        dispatch(commonSettingActions.appLoadingHide());
        if (getQueryVariable('type') == '3') {
            setTimeout(() => {
                downLoadCard();
            }, 1000)
        }
        if (getQueryVariable('type') == '4') {
            setTimeout(() => {
                window.print();
            }, 1000)
        }
    }

    //添加答题卡并上传pdf至服务器
    const uploadAnswerSheet = async (AnswerSheetObj) => {

        let repeatCount = 1;

        setLoading(true);
        setSettingOptionShow(false);

        let { QuesStruct, QuesCoord, TicketNOLength } = getCardData();

        let data = {
            ...AnswerSheetObj,
            QuesStruct,
            QuesCoord,
            TicketNOLength,
            Term: curTermRef.current,
        }
        let BlobObj = await downLoadCard(false);
        BlobObj.name = formRef.current.Title + '.pdf';
        BlobObj.lastModifiedDate = new Date();
        // let FileObj = new File([BlobObj], formRef.current.Title+'.pdf',{type: BlobObj.type, lastModified: Date.now()});
        let url = '';
        let returnSheetID = AnswerSheetObj.SheetID || '';
        let res1;
        if (returnSheetID != '') {
            res1 = await UpdateSheetInPaperMakeSystem({
                ...data,
                UserID: userInfoRef.current.UserID,
                QuesStruct: JSON.stringify(QuesStruct),
                dispatch
            })
        } else {
            res1 = await SaveSheetInPaperMakeSystem({
                ...data,
                UserID: userInfoRef.current.UserID,
                QuesStruct: JSON.stringify(QuesStruct),
                Term: curTermRef.current,
                dispatch
            });
            returnSheetID = res1 && res1.Data ? res1.Data : '';
            data.SheetID = returnSheetID;
        }

        if (res1 && res1.ResultCode == 0) {
            let res2 = await PromiseUpDataFile(BlobObj);
            if (res2.result == 'true') {
                url = JSON.parse(sessionStorage.getItem('PapergradebaseInfo'))['ResHttpServerUrl'] + res2.filePath;
            }
        } else if (res1 && res1.ResultCode == 2) {
            return await uploadAnswerSheet(
                {
                    ...AnswerSheetObj,
                    SheetName: AnswerSheetObj.SheetName + `(${repeatCount++})`
                }
            )
        }
        setLoading(false);
        return {
            newAnswerSheetObj: data,
            FileUrl: url,
            SheetID: returnSheetID
        };
    }

    //答题卡转换并渲染(后端---前端)
    const transformCardData = (data) => {
        let questionListData = data.QuesStruct.map((question) => {
            return {
                type: QuestionTypeMap2[question.QuesGroupType],
                title: question.QuesGroupName,
                showNum: question.LayoutParam || question.QuesLayoutParam,
                list: question.QuesList.map((item) => {
                    return {
                        QuesNO: item.QuesNO,
                        score: item.QuesScore,
                        answerValue: transformAnserStr(question.QuesGroupType, item.CorrectAnswer, true) || '',
                        optionNum: item.NodeCount || item.AnswerHeight
                    }
                }),
                startIndex: question.QuesList[0].QuesNO,
                endIndex: question.QuesList[question.QuesList.length - 1].QuesNO,
            }
        })
        dispatchForm({
            type: 'setForm',
            data: {
                SheetID: data.SheetID,
                Title: data.SheetName,
                SheetLayout: data.SheetLayout,    //答题卡布局栏数
                AdmissionNoLength: data.TicketNOLength,  //准考证号长度（6~12）
                TicketNOProvideType: data.TicketNOProvideType || '1',
                IsIncludeAB: data.IsIncludeAB || 0,
                QuesSortType: data.QuesSortType || 2,
                questionListData
            }
        })
        if (data.SheetLayout == 2 || data.SheetLayout == 3) {
            cssPagedMedia('A3 landscape')
        } else {
            cssPagedMedia('A4 portrait')
        }
    }

    //获取答题卡的结构/位置信息的JSON字符串
    const getCardData = () => {
        let QuesStruct = formRef.current.questionListData.map((question, index) => {
            return {
                QuesGroupNO: index + 1,
                QuesGroupType: QuestionTypeMap[question.type],
                QuesGroupName: question.title,
                QuesLayoutParam: question.showNum,
                QuesList: question.list.map((item) => {
                    return {
                        QuesNO: item.QuesNO,
                        QuesScore: item.score,
                        CorrectAnswer: transformAnserStr(question.type, item.answerValue),
                        NodeCount: item.optionNum,
                        // NodeCount: question.type == 'Answer' || question.type == 'Article' ? 0 : item.optionNum,
                        // AnswerHeight: question.type == 'Answer' || question.type == 'Article' ? item.optionNum : 0,
                    }
                })
            }
        })

        //题目位置信息
        let QuesCoord = getQuesCoord();

        return {
            QuesStruct: QuesStruct,
            QuesCoord: formRef.current.SheetLayout == 3 ? Math.ceil(showPageDataListRef.current.length / 3) : showPageDataListRef.current.length + ',' + JSON.stringify(QuesCoord),
            TicketNOLength: formRef.current.AdmissionNoLength
        }
    }

    //答案字符串转换1（前端----后端）
    const transformAnserStr = (type, str, reverse = false) => {
        return '';
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

    //下载答题卡，dowload为true直接下载，否则返回Blob对象
    const downLoadCard = async (dowload = true) => {
        let pageDomList = document.querySelectorAll('.answer-sheet-div');

        let paperType = formRef.current.SheetLayout == 1 ? 1 : 2;
        //A3布局时，两页A4包裹成一页A3
        if (paperType == 2) {
            let arr = filterArrByGroup([...pageDomList], formRef.current.SheetLayout);
            pageDomList = arr.map((doms) => {
                if (doms.length > 1) {
                    let wrapDom = document.createElement('div');
                    wrapDom.style.display = 'flex';
                    wrapDom.style.width = '420mm';
                    wrapDom.appendChild(doms[0]);
                    wrapDom.appendChild(doms[1]);
                    if (doms[2]) {
                        wrapDom.appendChild(doms[2]);
                    }
                    document.getElementsByClassName('card-print-wrapper')[0].appendChild(wrapDom);
                    return wrapDom;
                } else {
                    //该分支不触发，因为奇数页时会补一页空白页
                    return doms[0];
                }
            })
        }
        let pageCanvasList = await Promise.all([...pageDomList].map((pageDom) => {
            return html2canvas(pageDom, {
                allowTaint: true,
                dpi: window.devicePixelRatio, // 提升导出文件的分辨率
                scale: 4 // 提升导出文件的分辨率
            })
        }))

        let pageFormat = paperType == 2 ? 'a3' : 'a4';   //纸张布局
        let orientation = paperType == 2 ? 'l' : 'p';    //纸张方向，l:横向，p:竖向

        let pdf = new jsPDF(orientation, 'pt', pageFormat);

        pageCanvasList.forEach((canvas, index) => {

            let contentWidth = canvas.width / paperType;
            let contentHeight = canvas.height;
            //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
            let imgWidth = 595.28;
            let imgHeight = 592.28 / contentWidth * contentHeight;
            let pageData = canvas.toDataURL('image/jpeg', 1.0);

            if (paperType == 2) {
                pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth * 2, imgHeight);
            } else {
                pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight);
            }
            if (index + 1 !== pageCanvasList.length) {
                pdf.addPage();
            }
        })

        if (dowload) {
            pdf.save(formRef.current.Title + ".pdf");
        } else {
            return pdf.output('blob');
        }
    }

    //用于组卷系统对接，控制设置参数的UI是否显示
    const [settingOptionShow, setSettingOptionShow] = useState(false);

    const [inputValue, setInputValue] = useState('');
    const inputValueRef = useStateValue(inputValue);

    const [modalShow, setModalShow] = useState(false);

    //提示弹窗配置信息
    const [alertConfig, setAlertConfig] = useState({
        type: '',
        alertShow: false,
        title: '',
        onCancel: alertHide,
        onOk: alertHide,
        onHide: alertHide
    })

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

    //准考证位数
    const inputChange = (e) => {
        if (e.target.value.length > 2) {
            return;
        }
        setInputValue(e.target.value);
    }

    //确认设置准考证号长度
    const confirmSetLength = () => {
        let num = parseInt(inputValueRef.current);
        if (num >= 6 && num <= 12) {
            dispatchForm({
                type: 'setForm',
                data: {
                    AdmissionNoLength: parseInt(inputValueRef.current)
                }
            })
            setModalShow(false);
            setInputValue('');
        } else {
            showAlert({
                title: '请输入6~12之间的数字',
                alertShow: true,
                type: 'warn'
            })
        }
    }

    //每组题数(每行空格数)
    const displayParamChange = (e, index, type) => {
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
        if ((value <= 0 || value > 20) && type != 'Completion') {
            showAlert({
                title: '每列题目数需在1~20之间',
                alertShow: true,
                type: 'warn'
            })
            return;
        }
        let temp = formRef.current.questionListData.slice();
        temp[index]['showNum'] = value || 1;
        dispatchForm({
            type: 'setForm',
            data: {
                questionListData: temp
            }
        })
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

    //获取dataset兼容IE
    const getDataset = (ele) => {
        if (ele.dataset) {
            return ele.dataset;
        } else {
            var attrs = ele.attributes,//元素的属性集合
                dataset = {},
                name,
                matchStr;

            for (var i = 0; i < attrs.length; i++) {
                //是否是data- 开头
                matchStr = attrs[i].name.match(/^data-(.+)/);
                if (matchStr) {
                    //data-auto-play 转成驼峰写法 autoPlay
                    name = matchStr[1].replace(/-([\da-z])/gi, function (all, letter) {
                        return letter.toUpperCase();
                    });
                    dataset[name] = attrs[i].value;
                }
            }
            return dataset;
        }
    }

    //获取答题卡位置信息
    const getQuesCoord = () => {

        //每张纸的节点列表
        let cardDomList = Array.from(document.querySelectorAll('.answer-sheet-div'));

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
        if (formRef.current.SheetLayout == 3) {
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
        pageQuestionArr.forEach((item, idx) => {
            let PositionArr = [];

            //三栏布局时，坐标按整页传，columnNo为栏下标
            let columnNo = formRef.current.SheetLayout == 3 ? idx % 3 : 0;

            item.questionDomList.forEach((child) => {
                let { offsetY: offsetY1, offsetX: offsetX1 } = computeDomPosition(child, item.parentNode);
                let offsetY2 = child.offsetHeight + offsetY1;
                let offsetX2 = child.offsetWidth + offsetX1;
                let answerList = Array.from(child.querySelectorAll('.answer-question-item'));   //当前页面的解答题小题节点
                let rowList = Array.from(child.querySelectorAll('.row-list'));    //选择题或判断题的行节点
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
                    questype: child.dataset.questype,
                    startIndex: parseInt(child.dataset.startindex)
                });
            })

            PositionArr.forEach((point, i) => {
                if (showPageDataListRef.current[idx][i]['title']) {
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
                        questype: point.questype,
                        startIndex: point.startIndex
                    }
                } else {
                    let len = PositionInfo[QuesNo]['Location'].length;
                    PositionInfo[QuesNo]['Location'][len] = point.pos;
                    PositionInfo[QuesNo]['ContentLocation'][len] = point.contentPos;
                    PositionInfo[QuesNo]['CompletionLoaction'][len] = point.completionPos;
                    PositionInfo[QuesNo]['AnswerLocation'][len] = point.answerPos;
                }
            })
        })

        // QuesNo从1开始，所以第一项为空删除
        PositionInfo = PositionInfo.slice(1, PositionInfo.length);

        let QuesCoord = JSON.parse(JSON.stringify(PositionObjTemplate));
        QuesCoord.IDNumber = formRef.current.AdmissionNoLength;
        QuesCoord.Style = formRef.current.SheetLayout == 1 ? 'A4' : 'A3';
        QuesCoord.Size = [cardWidth, cardHeight];
        QuesCoord.Column = formRef.current.SheetLayout;

        //区分A、B卷
        let diffPaperArea = document.querySelector('.diff-paper-label');
        let areaA = document.querySelector('#diff-paper-area-A');
        let areaB = document.querySelector('#diff-paper-area-B');
        if (formRef.current.IsIncludeAB == 1) {
            QuesCoord.DiffPaper = [
                computeDomPosition(diffPaperArea, cardDomList[0]),
                computeDomPosition(areaA, cardDomList[0]),
                computeDomPosition(areaB, cardDomList[0])
            ].map((rect) => {
                return [rect.offsetX, rect.offsetY, rect.offsetX + rect.offsetWidth, rect.offsetY + rect.offsetHeight]
            })
        }

        if (formRef.current.SheetLayout == 3) {
            QuesCoord.Size = [cardWidth * 3, cardHeight];
        }
        QuesCoord.Sign = [
            [x1, y1, (x1 + w), (y1 + h)],
            [x2, y2, (x2 + w), (y2 + h)],
            [x3, y3, (x3 + w), (y3 + h)]
        ]
        if (form.TicketNOProvideType.includes('1')) {
            QuesCoord.StudentID = [
                [offsetX1, offsetY1, offsetX2, (offsetY1 + 40)],
                [offsetX1, (offsetY1 + 40), offsetX2, offsetY2]
            ]
        }
        if ((form.TicketNOProvideType.includes('2') || form.TicketNOProvideType.includes('3'))) {
            let barAreaDom = document.querySelector('.bar-code-area');
            let { offsetY: barY, offsetX: barX, offsetHeight: barH, offsetWidth: barW } = computeDomPosition(barAreaDom, cardDomList[0]);
            QuesCoord.BarCode = [
                [barX, barY, barX + barW, barY + barH]
            ]
        }
        PositionInfo.forEach((quesGroupItem) => {
            let pageArr = [];
            switch (quesGroupItem.questype) {
                case 'Single':
                case 'Multiple':
                case 'Judgment':
                    let key = quesGroupItem.questype;
                    if (quesGroupItem.questype == 'Judgment') {
                        key = 'Judge'
                    }
                    pageArr = quesGroupItem.Location.map((rect, pageIndex) => {
                        return quesGroupItem.PageNo + pageIndex;
                    })
                    if (formRef.current.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3))
                    }
                    QuesCoord[key].push({
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
                        // content: quesGroupItem.ContentLocation.map((rect)=>{
                        //     return [
                        //         rect.left,
                        //         rect.top,
                        //         rect.right,
                        //         rect.bottom,
                        //     ]
                        // }),
                        answer: transformAnserStr2(quesGroupItem.QuesNo, quesGroupItem.questype)
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
                                page: formRef.current.SheetLayout == 3 ? Math.ceil((quesGroupItem.PageNo + pageIndex) / 3) : quesGroupItem.PageNo + pageIndex,
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
                    if (formRef.current.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3))
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
                                    formRef.SheetLayout == 3
                                        ?
                                        Math.ceil((quesGroupItem.PageNo + pageIndex) / 3)
                                        :
                                        answerPosItem['page'][len - 1] + 1
                                )
                            } else {
                                answerPos.push({
                                    NO: answer.no,
                                    page: [formRef.SheetLayout == 3 ? Math.ceil((quesGroupItem.PageNo + pageIndex) / 3) : quesGroupItem.PageNo + pageIndex],
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
                    if (formRef.current.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3))
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
                    if (formRef.current.SheetLayout == 3) {
                        pageArr = pageArr.map((NoItem) => Math.ceil(NoItem / 3))
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

        return QuesCoord;
    }

    //文件上传资源服务器
    const upDataFile = (resolve, reject, file, filePathDir, path, hasSendNum) => {
        let date = new Date();
        let diskName = `CorrectPaperTest/${(date.getMonth() + 1) + '-' + date.getDate()}/MakeTestPaper/${userInfoRef.current.UserID}/`;

        let ResHttpSvrRootUrl = JSON.parse(sessionStorage.getItem('PapergradebaseInfo'))['ResHttpServerUrl'];
        let url = `${ResHttpSvrRootUrl}/file`;

        let formData = new FormData();
        formData.append('path', path);
        formData.append('method', 'doUpload_WholeFile');
        // formData.append('userid', JSON.parse(sessionStorage.getItem("UserInfo")).UserID);
        formData.append('userid', userInfoRef.current.UserID);
        formData.append('threads', 1);
        formData.append('isPaused', hasSendNum == 0 ? 0 : 1);
        formData.append('chunkSize', 1);
        formData.append('filename', file.name);
        formData.append('chunk', hasSendNum);
        formData.append('chunks', Math.ceil(file.size / 1024 / 1024));
        formData.append('diskName', diskName);
        let slice = file.slice(hasSendNum * BYTES_PER_SLICE, (hasSendNum + 1) * BYTES_PER_SLICE);//切割文件
        formData.append('file', slice);

        $.ajax({
            url,
            type: 'POST',
            cache: false,
            data: formData,
            //dataType: 'json',
            //async: false,
            processData: false,
            contentType: false,
        }).done(function (res) {
            path = JSON.parse(res).filePath;
            if (hasSendNum != Math.floor(file.size / BYTES_PER_SLICE)) {
                hasSendNum++;
                upDataFile(resolve, reject, file, filePathDir, path, hasSendNum);
            } else {
                resolve(JSON.parse(res));
            }

        }).fail(function (res) {
            showAlert({
                type: 'btn-error',
                alertShow: true,
                title: '文件上传失败请重试'
            })
            setLoading(false);
            reject(JSON.parse(res))
        });
    }

    //封装上传文件方法，返回Promise对象
    const PromiseUpDataFile = (file, filePathDir = '', path = '', hasSendNum = 0) => {
        return new Promise((resolve, reject) => {
            upDataFile(resolve, reject, file, filePathDir, path, hasSendNum);
        })
    }

    const showPoint = (pageIdx, ponitIdx) => {
        return true;
        if (form.SheetLayout == 3) {
            let columnNo = pageIdx % 3;
            if (columnNo == 0 && (ponitIdx == 1 || ponitIdx == 3)) {
                return true;
            } else if (columnNo == 1 && ponitIdx == 4) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
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
    const [isgrab, setisgrab] = useState(false);
    const isgrabRef = useStateValue(isgrab);
    const [isClick, setisClick] = useState(true);
    const isClickRef = useStateValue(isClick);
    const MouseDownFN = (e) => {
        // return
        var o = document.getElementById('Sheetfixd');


        if (o.setCapture) { //IE低版本
            o.setCapture()
        }
        e = e || window.event
        //鼠标相对于盒子的位置
        var offsetX = e.clientX - o.offsetLeft;
        var offsetY = e.clientY - o.offsetTop;
        //  鼠标移动
        document.onmousemove = function (e) {
            setisgrab(true);
            setTimeout(() => {
                setisClick(false);
            }, 100)
            e = e || window.event
            o.style.left = e.clientX - offsetX + "px";
            o.style.top = e.clientY - offsetY + "px";
        }
        // //鼠标抬起
        // document.onmouseup = function () {
        //     setisgrab(false);
        //     setTimeout(() => {
        //         setisClick(true);
        //     },10)
        //     // setTimeout(() => {
        //     //     setisClick(true);
        //     // })
        //     // document.onmousemove = null;
        //     // document.onmouseup = null;
        //     if (o.releaseCapture) {
        //         o.releaseCapture(); //释放全局捕获   
        //     }
        // }
        return false; //标准浏览器的默认行为
    }
    const MouseUpFn = (e) => {
        console.log('抬起了');
        setisgrab(false);
        setTimeout(() => {
            setisClick(true);
        }, 10)
        var o = document.getElementById('Sheetfixd');
        // setTimeout(() => {
        //     setisClick(true);
        // })
        document.onmousemove = null;
        // document.onmouseup = null;

        if (o.releaseCapture) {
            o.releaseCapture(); //释放全局捕获   
        }
    }
    return (

        <div
            className={`preview-card-container ${cardClassName}`}
            style={(cardClassName == 'print' || cardClassName == 'preview') && (form.SheetLayout == 2 || form.SheetLayout == 3) ? { width: '420mm' } : {}}
        >
            <Scrollbars
                style={(form.SheetLayout == 2 || form.SheetLayout == 3) && cardClassName === '' ? { width: '1800px' } : {}}
                autoHeight={true}
                autoHeightMax={cardClassName == 'preview' ? (getQueryVariable('implant') == '1' ? 695 : ((form.SheetLayout == 2 || form.SheetLayout == 3) ? 830 : 620)) : 10000}
                renderTrackHorizontal={cardClassName == 'print' ? (props) => <div {...props} className='hidden-bar'></div> : undefined}
                renderTrackVertical={cardClassName == 'print' ? (props) => <div {...props} className='hidden-bar'></div> : undefined}
            >
                <div
                    className={(form.SheetLayout == 2 || form.SheetLayout == 3) ? "answer-content-wrapper A3-wrapper" : "answer-content-wrapper"}
                    style={(cardClassName == 'print' || cardClassName == 'preview') && (form.SheetLayout == 2 || form.SheetLayout == 3) ? { width: '420mm' } : {}}
                >
                    <div className="card-print-wrapper">
                        {
                            showPageDataList.map((pageData, index) => {
                                return (
                                    <div className={form.SheetLayout == 3 ? "answer-sheet-div display-card-three-columns" : "answer-sheet-div"} data-id={index} key={index}>
                                        <div className="page-box">
                                            {showPoint(index, 1) && <div className="position-point-1"></div>}
                                            {showPoint(index, 2) && <div className="position-point-2"></div>}
                                            {showPoint(index, 3) && <div className="position-point-3"></div>}
                                            {/* {showPoint(index,4) && form.SheetLayout == 3 && <div className="position-point-4"></div>} */}
                                            {index == 0 &&
                                                <div className="preview-card-title">{form.Title}</div>
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
                                                                {/* {form.TicketNOProvideType !== '2' && form.TicketNOProvideType !== '3' && <span className="edit-btn" onClick={() => { setModalShow_1(true); setinputValue_2(form.AdmissionNoLength) }} >编辑</span>} */}
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
                                                                        {settingOptionShow &&
                                                                            <div className="operation-div">
                                                                                {(item.type == 'Completion' || item.type == 'Single' || item.type == 'Multiple' || item.type == 'Judgment') &&
                                                                                    <>
                                                                                        {item.type == 'Completion' ?
                                                                                            <span style={{ color: '#999999', fontSize: '12px' }}>每行展示空格数：</span>
                                                                                            :
                                                                                            <span style={{ color: '#999999', fontSize: '12px' }}>每列题目数：</span>
                                                                                        }
                                                                                        <Input
                                                                                            maxLength={2}
                                                                                            type="number"
                                                                                            value={item.showNum}
                                                                                            onChange={(e) => { displayParamChange(e, item.NO - 1, item.type) }}
                                                                                            style={{ padding: '0px' }}
                                                                                        ></Input>
                                                                                    </>
                                                                                }
                                                                            </div>
                                                                        }
                                                                    </div>
                                                                }
                                                                <div
                                                                    className={item.type == 'Answer' || item.type == 'Other' || item.type == 'OptionalQues' || item.type == 'Comprehensive' ? "no-padding question-list-wrapper" : "question-list-wrapper"}
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
                                                                                                <div className="ShowQuesImage"
                                                                                                    style={{
                                                                                                        width: `${it.AnswerImage.ImageSize.split('%')[0]}px`,
                                                                                                        height: `${it.AnswerImage.ImageSize.split('%')[1]}px`,
                                                                                                        position: 'absolute',
                                                                                                        top: `${it.AnswerImage.ImagePosition.split('%')[1] * 1 === 0 ? (!it.hiddenNo ? '29px' : '0') : it.AnswerImage.ImagePosition.split('%')[1] * 1 === 2 ? 'inherit' : (!it.hiddenNo ? 'calc(50% + 14px)' : '50%')}`,
                                                                                                        bottom: `${it.AnswerImage.ImagePosition.split('%')[1] * 1 === 2 ? 0 : 'inherit'}`,
                                                                                                        left: `${it.AnswerImage.ImagePosition.split('%')[0] * 1 === 0 ? '0' : it.AnswerImage.ImagePosition.split('%')[0] * 1 === 2 ? 'inherit' : '50%'}`,
                                                                                                        right: `${it.AnswerImage.ImagePosition.split('%')[0] * 1 === 2 ? 0 : 'inherit'}`,
                                                                                                        transform: `translate(${it.AnswerImage.ImagePosition.split('%')[0] * 1 === 1 ? '-50%' : '0'}, ${it.AnswerImage.ImagePosition.split('%')[1] * 1 === 1 ? '-50%' : '0'})`,
                                                                                                        backgroundImage: `url('${JSON.parse(sessionStorage.getItem("PapergradebaseInfo")).ResHttpServerUrl}${it.AnswerImage.ImagePath}')`
                                                                                                    }}
                                                                                                ></div>

                                                                                            }
                                                                                            {/* {changeAnswerHeight && !it.hiddenNo &&
                                                                                                <div className="answer-height-input-div">


                                                                                                    <span className="answer-Pic" onClick={() => { UpLoadFn(it, index, _index, id) }}><i></i>上传图片</span>
                                                                                                    <span>高 </span>

                                                                                                    <Input
                                                                                                        className="answer-height-input"
                                                                                                        maxLength={2}
                                                                                                        type="number"
                                                                                                        value={it.originOptionNum || it.optionNum}
                                                                                                        onChange={(e) => { changeAnswerHeight(e, item.NO - 1, it.quesIndex, id) }}
                                                                                                    ></Input>
                                                                                                    <span> 行</span>
                                                                                                </div>
                                                                                            } */}
                                                                                        </div>
                                                                                    )
                                                                                })
                                                                            }
                                                                        </div>
                                                                    </div> : renderQuestion(item, form.SheetLayout, form.QuesSortType, null, showPageDataList, index)}
                                                                    {/* {renderQuestion(item, form.SheetLayout, form.QuesSortType)} */}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </div>
                                        {hasFooter && form.SheetLayout != 3 &&
                                            <div className="page-footer">
                                                <div className="page-index">
                                                    <span>第{index + 1}页</span>
                                                    <span>共{showPageDataList.length}页</span>
                                                </div>
                                            </div>
                                        }
                                        {hasFooter && form.SheetLayout == 3 && (index + 1) % 3 == 2 &&
                                            <div className="page-footer">
                                                <div className="page-index">
                                                    <span>第{Math.ceil((index + 1) / 3)}页</span>
                                                    <span>共{Math.ceil(showPageDataList.length / 3)}页</span>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                )
                            })
                        }
                        {form.SheetLayout == 2 && showPageDataList.length % 2 != 0 &&
                            <div className="answer-sheet-div">
                                <div className="position-point-1"></div>
                                <div className="position-point-2"></div>
                                <div className="position-point-3"></div>
                            </div>
                        }
                        {form.SheetLayout == 3 && showPageDataList.length % 3 == 1 &&
                            <>
                                <div className="answer-sheet-div display-card-three-columns">
                                    <div className="page-box">
                                        <div className="position-point-1"></div>
                                        <div className="position-point-2"></div>
                                        <div className="position-point-3"></div>
                                    </div>
                                    <div className="page-footer">
                                        <div className="page-index">
                                            <span>第{Math.ceil(showPageDataList.length / 3)}页</span>
                                            <span>共{Math.ceil(showPageDataList.length / 3)}页</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="answer-sheet-div display-card-three-columns">
                                    <div className="page-box">
                                        <div className="position-point-1"></div>
                                        <div className="position-point-2"></div>
                                        <div className="position-point-3"></div>
                                    </div>
                                </div>
                            </>
                        }
                        {form.SheetLayout == 3 && showPageDataList.length % 3 == 2 &&
                            <div className="answer-sheet-div display-card-three-columns">
                                <div className="page-box">
                                    <div className="position-point-1"></div>
                                    <div className="position-point-2"></div>
                                    <div className="position-point-3"></div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </Scrollbars>

            {/* {cardClassName == '' && <div id="Sheetfixd" className="fixed-download-btn " title='拖拽可调整位置' onMouseUp={MouseUpFn} onMouseDown={(e) => { MouseDownFN(e) }} style={isgrab ? { cursor: ' grabbing' } : {}}>
                <span onClick={() => {
                    if (isClick) {
                        downLoadCard()
                    }
                }}>下载</span>
                <span onClick={() => { if (isClick) { window.close() } }}>关闭</span>
            </div>} */}

            {/* 准考证位数设置 */}
            <Modal
                title="设置准考证号长度"
                type="1"
                visible={modalShow}
                bodyStyle={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                className="admission-edit-modal"
                onOk={confirmSetLength}
                onCancel={
                    () => {
                        setModalShow(false);
                        setInputValue('');
                    }
                }
            >
                <div className="content-wrapper">
                    <label>准考证号长度：</label>
                    <Input
                        maxLength={2}
                        type="number"
                        placeholder={"请输入6~12之间的数字"}
                        value={inputValue}
                        onChange={inputChange}
                    ></Input>
                </div>
                <Alert
                    type={alertConfig.type}
                    title={alertConfig.title}
                    show={alertConfig.alertShow && modalShow}
                    onClose={alertConfig.onCancel}
                    onCancel={alertConfig.onCancel}
                    onHide={alertConfig.onHide}
                    onOk={alertConfig.onOk}
                >
                </Alert>
            </Modal>
            <Alert
                type={alertConfig.type}
                title={alertConfig.title}
                show={alertConfig.alertShow && !modalShow}
                onClose={alertConfig.onCancel}
                onCancel={alertConfig.onCancel}
                onHide={alertConfig.onHide}
                onOk={alertConfig.onOk}
            >
            </Alert>
        </div>

    )
}

export default CardPreviw