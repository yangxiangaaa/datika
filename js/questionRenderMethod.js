import React from "react";
import { Input, Tooltip } from "antd";
import {
    getOneMmsPx,
    filterArrByGroup,
    flatten
} from "./util";

/**
 * 每mm对应的px
**/
let mmWidth = getOneMmsPx();

/**
 * @description 重构题目的结构，方便用于计算题目占据的高度及题目渲染
 * @param {object} data 大题数据
 * @param {string} type 题目类型
 * @param {number} [columns] 答题卡栏数
 * @param {number} [displayType] 客观题排序方式（1：竖排，2：横排）
 * @return {Array} 返回重构之后的题目数据
 **/
export const restructData = (data, type, columns = 1, displayType = 2) => {
    if (!mmWidth || mmWidth < 1) {
        mmWidth = getOneMmsPx();
    }
    let renderData = [];
    switch (type) {
        case 'Single':
        case 'Multiple':
        case 'Judgment':
            let colList = filterArrByGroup(data.list, data.showNum);
            let ContentWidth = mmWidth * 191 - 38;    //内容盒子可渲染的像素
            if (columns == 3) {
                ContentWidth = mmWidth * 128 - 38;
            }
            let maxOptionNumList = colList.map((arr) => {             //每组题目中，最大选项数
                let maxNum = 0;
                arr.forEach((item) => {
                    if (maxNum < item.optionNum) {
                        maxNum = item.optionNum;
                    }
                })
                return maxNum;
            })
            let rowGroupList = [];  //每组题目分行显示
            let curWidth = 0;
            let curRow = [];
            let rowIndex = 0;
            colList.forEach((arr, index) => {
                let groupWidth = (maxOptionNumList[index] + 1) * 25 + 10;
                if (displayType == 1) {
                    groupWidth = data.showNum * 25 + 10;
                }
                // console.log(groupWidth);
                curWidth += groupWidth;     //计算每组题目的宽度和
                if (curWidth < ContentWidth) {
                    curRow.push(arr);
                    if (index == colList.length - 1) {
                        rowGroupList[rowIndex] = curRow;
                    }
                } else {
                    rowGroupList[rowIndex] = curRow;
                    curRow = [arr];
                    curWidth = displayType == 1 ? data.showNum * 25 + 10 : (maxOptionNumList[index] + 1) * 25 + 10;
                    if (index == colList.length - 1) {
                        rowGroupList[++rowIndex] = curRow;
                    } else {
                        rowIndex++;
                    }
                }
            })
            renderData = rowGroupList;
            break;
        // case 'Judgment':
        //     renderData = filterArrByGroup(filterArrByGroup(data.list, data.showNum), 8);
        //     if(columns==3){
        //         renderData = filterArrByGroup(filterArrByGroup(data.list, data.showNum), 5);
        //     }
        //     break;
        case 'Completion':
            let tempList = [];
            let tempArr = [];
            let curCount = 0;
            data.list.forEach((item, index) => {
                if (item.optionNum >= data.showNum) {
                    if (tempArr.length > 0) {
                        tempList.push(tempArr);
                        curCount = 0;
                        tempArr = [];
                    }
                    tempList.push([item]);
                } else {
                    curCount += item.optionNum;
                    if (curCount > data.showNum) {
                        tempList.push(tempArr);
                        tempArr = [item];
                        curCount = item.optionNum;
                        if (index == data.list.length - 1) {
                            tempList.push(tempArr);
                        }
                    } else {
                        tempArr.push(item);
                        if (index == data.list.length - 1) {
                            tempList.push(tempArr);
                        }
                    }
                }
            })
            renderData = tempList;
            break;
        case 'Answer':
            renderData = data.list;
            break;
        case 'OptionalQues':
        case 'Other':
            renderData = data.list;
            break;
        case 'Article':
            renderData = (new Array(data.list[0].optionNum)).fill(1).map((item, index) => {
                return {
                    ...data.list[0]
                };
            });
            break;
    }

    return renderData;
}

/**
 * @description 获取每页的题目数据
 * @param {object} dataList 答题卡数据
 * @param {boolean} [isComprehensive] 是否为综合题（注：当前暂不使用，默认传false）
 * @param {number} [initSurplusHeight] 当前页面剩余高度，用于综合题渲染（注：当前暂不使用，默认传0）
 * @param {number} [displayType] 客观题排序方式（1：竖排，2：横排）
 * @param {number} [headerHeight] 第一页头部区域的高度
 * @returns {Array} 返回分页后的每页数据
 **/
export const getPageData = (dataList, isComprehensive = false, initSurplusHeight = 0, displayType = 2, headerHeight = 412) => {
    if (!mmWidth || mmWidth < 1) {
        mmWidth = getOneMmsPx();
    }
    let pageHight = mmWidth * 257;      //单张页面的内容区高度
    let pageDataList = [];                   //分页数组
    let curPageIndex = 0;                   //当前页面下标
    let surplusHeight = pageHight - headerHeight;    //当前页面剩余可用高度
    if (isComprehensive) {
        surplusHeight = initSurplusHeight;
    }
    console.log(dataList);
    for (let questionGroup of dataList) {

        if (!isComprehensive) {
            surplusHeight = surplusHeight - 50;     //减去每组题目标题的高度
        }
        if (questionGroup.type == 'Completion') {     //若为填空题，则再减去填空题的下方padding(30px)
            surplusHeight = surplusHeight - 30;
        }
        if (questionGroup.type == 'Article') {     //若为作文题，则再减去作文题的上下方padding(35px)
            surplusHeight = surplusHeight - 35;
        }

        if (questionGroup.type == 'Comprehensive') {
            let splitQuesData = getPageData(questionGroup.childQuesGroupList, true, surplusHeight, displayType);
            surplusHeight = splitQuesData.surplusHeight;
            splitQuesData.pageDataList.forEach((childQuesGroupList, i, arr) => {
                if (!pageDataList[curPageIndex]) {
                    pageDataList[curPageIndex] = [];
                }

                if (i == 0 && childQuesGroupList.length > 0) {
                    pageDataList[curPageIndex].push({
                        ...questionGroup,
                        childQuesGroupList
                    })
                } else if (i > 0) {
                    pageDataList[curPageIndex].push({
                        ...questionGroup,
                        title: i == 1 && arr[0]['length'] == 0 ? questionGroup.title : '',
                        childQuesGroupList
                    })
                }

                if ((i == 0 && childQuesGroupList.length == 0) || i != arr.length - 1) {
                    curPageIndex++;
                }
            })
            continue;
        }

        let separateIndex = [];     //行分割下标数组(题目换页的分割点下标)
        let answerSplitLineHeightArr = []  //解答题分割行高数组
        for (let i = 0; i < questionGroup.rowGroupList.length; i++) {
            let { height, isContain, AnswerLineHeightArr } = checkIsPageContain(surplusHeight, questionGroup.rowGroupList[i], questionGroup, displayType);
            //当前页面无法容纳解答题题干及至少1行的行高时，将题干与第一小题直接换页处理
            if (i == 0 && surplusHeight < 30 && (questionGroup.type == 'Answer' || questionGroup.type == 'Other' || questionGroup.type == 'OptionalQues')) {
                AnswerLineHeightArr = checkIsPageContain(surplusHeight, questionGroup.rowGroupList[i], questionGroup, displayType, pageHight - 50)['AnswerLineHeightArr'];
                height = checkIsPageContain(surplusHeight, questionGroup.rowGroupList[i], questionGroup, displayType, pageHight - 50)['height'];
            }
            answerSplitLineHeightArr.push(AnswerLineHeightArr);
            if (!isContain) {
                separateIndex.push(i);
                surplusHeight = pageHight - height;
                if (questionGroup.type == 'Completion') {     //若为填空题，则再减去填空题的下方padding(30px)
                    surplusHeight = surplusHeight - 30;
                }
                if (questionGroup.type == 'Article') {     //若为作文题，则再减去作文题的上下方padding(35px)
                    surplusHeight = surplusHeight - 35;
                }
                //非解答题第一小题换页，i为0时，直接换页，所以再减去标题高度
                if (i == 0 && !isComprehensive && questionGroup.type != 'Answer' && questionGroup.type != 'Other' && questionGroup.type != 'OptionalQues') {
                    surplusHeight = surplusHeight - 50;
                }
                //解答题第一小题换页，i为0时，直接换页，所以再减去标题高度
                if (i == 0 && !isComprehensive && (questionGroup.type == 'Answer' || questionGroup.type == 'Other' || questionGroup.type == 'OptionalQues') && AnswerLineHeightArr[0] == 0) {
                    surplusHeight = surplusHeight - 50;
                }
            } else {
                surplusHeight = surplusHeight - height;
            }
        }
        console.log(answerSplitLineHeightArr);
        //无需换页的情况
        if (separateIndex.length == 0) {
            if (!pageDataList[curPageIndex]) {
                pageDataList[curPageIndex] = [];
            }
            pageDataList[curPageIndex].push(questionGroup);
            // if(idx != dataList.length-1 && surplusHeight < getQuestionGroupHeighet(dataList[idx+1])){
            //     surplusHeight = pageHight;
            //     curPageIndex++;
            // }
        } else {
            // console.log(answerSplitLineHeightArr);
            //解答题分页
            if (questionGroup.type == 'Answer' || questionGroup.type == 'Other' || questionGroup.type == 'OptionalQues') {
                for (let [quesIndex, arr] of answerSplitLineHeightArr.entries()) {
                    if (arr.length > 1) {
                        for (let i = 0; i < arr.length; i++) {
                            if (i == 0 && arr[i] == 0) {
                                curPageIndex++;
                                continue;
                            } else {
                                if (!pageDataList[curPageIndex]) {
                                    pageDataList[curPageIndex] = [];
                                }
                                if (i == 0 && quesIndex != 0) {
                                    let len = pageDataList[curPageIndex]['length'];
                                    pageDataList[curPageIndex][len - 1] = {
                                        ...questionGroup,
                                        title: pageDataList[curPageIndex][len - 1]['title'] ? questionGroup.title : '',
                                        list: [
                                            ...pageDataList[curPageIndex][len - 1]['list'],
                                            {
                                                ...questionGroup.list[quesIndex],
                                                QuesNo: questionGroup.list[quesIndex]['QuesNo'],
                                                optionNum: arr[i],
                                                hiddenNo: !(i == 0 || (i == 1 && arr[0] == 0)) ? true : false,        //用于判断是否是分页的题目，从分页后的第二个框开始不显示题号
                                                originOptionNum: questionGroup.list[quesIndex]['optionNum'],    //记录原来的行数
                                                quesIndex,       //记录原来的小题下标
                                            }
                                        ]
                                    }
                                } else {
                                    pageDataList[curPageIndex].push({
                                        ...questionGroup,
                                        title: (quesIndex == 0 && i == 0) || (quesIndex == 0 && arr[0] == 0 && i == 1) ? questionGroup.title : '',
                                        list: [{
                                            ...questionGroup.list[quesIndex],
                                            QuesNo: questionGroup.list[quesIndex]['QuesNo'],
                                            optionNum: arr[i],
                                            hiddenNo: !(i == 0 || (i == 1 && arr[0] == 0)) ? true : false,
                                            originOptionNum: questionGroup.list[quesIndex]['optionNum'],
                                            quesIndex
                                        }]
                                    })
                                }
                                if (i < arr.length - 1) {
                                    curPageIndex++;
                                }
                            }
                        }
                    } else {
                        if (!pageDataList[curPageIndex]) {
                            pageDataList[curPageIndex] = [];
                        }
                        let len = pageDataList[curPageIndex]['length'];
                        if (len > 0 && quesIndex != 0) {
                            pageDataList[curPageIndex][len - 1] = {
                                ...questionGroup,
                                title: pageDataList[curPageIndex][len - 1]['title'] ? questionGroup.title : '',
                                list: [
                                    ...pageDataList[curPageIndex][len - 1]['list'],
                                    {
                                        ...questionGroup.list[quesIndex],
                                        optionNum: arr[0],
                                        originOptionNum: questionGroup.list[quesIndex]['optionNum'],
                                        quesIndex
                                    }
                                ]
                            }
                        } else {
                            pageDataList[curPageIndex].push({
                                ...questionGroup,
                                title: quesIndex == 0 ? questionGroup.title : '',
                                list: [{
                                    ...questionGroup.list[quesIndex],
                                    optionNum: arr[0],
                                    originOptionNum: questionGroup.list[quesIndex]['optionNum'],
                                    quesIndex
                                }]
                            })
                        }
                    }
                }
                continue;
            }


            //需换页，从第一小题换页，且分页数为1，则进入下一次循环
            if ((separateIndex[0] == 0 && separateIndex.length == 1)) {
                if (curPageIndex == 0) {
                    pageDataList[0] = pageDataList[0] ? pageDataList[0] : [];
                }
                pageDataList[++curPageIndex] = [questionGroup];
                continue;
            }

            if (!pageDataList[curPageIndex]) {
                pageDataList[curPageIndex] = [];
            }

            //第一次分割的小题下标
            let firstSplitNo = [...flatten(questionGroup.rowGroupList.slice(0, separateIndex[0]))].length;

            //需换页，若第一次换页的分割点不为0则添加第一次分割数据，否则直接换页
            if (separateIndex[0] != 0) {
                pageDataList[curPageIndex++].push({
                    ...questionGroup,
                    list: questionGroup.type == 'Article' ? [{
                        ...questionGroup.list[0],
                        optionNum: firstSplitNo,
                        originOptionNum: questionGroup.list[0]['optionNum']
                    }] : questionGroup.list.slice(0, firstSplitNo),
                });
            } else {
                curPageIndex++;
            }

            if (!pageDataList[curPageIndex]) {
                pageDataList[curPageIndex] = [];
            }
            //按分割次数（换页次数）做不同处理
            if (separateIndex.length == 1) {
                pageDataList[curPageIndex].push({
                    ...questionGroup,
                    title: '',
                    list: questionGroup.type == 'Article' ? [{
                        optionNum: questionGroup.list[0].optionNum - firstSplitNo,
                        originOptionNum: questionGroup.list[0]['optionNum']
                    }] : questionGroup.list.slice(firstSplitNo, questionGroup.list.length),
                })
            } else {
                //当前被分割的行终止下标
                let curEndIndex = separateIndex[1];
                //当前分割小题起始题号
                let beginSplitNo = firstSplitNo;
                // @ts-ignore
                for (let [i, v] of separateIndex.entries()) {
                    //作为分割点的小题的终止下标
                    let endSplitNo = [...flatten(questionGroup.rowGroupList.slice(0, curEndIndex))].length;
                    //将题组切割
                    let splitList = i == separateIndex.length - 1 ? questionGroup.list.slice(beginSplitNo, questionGroup.list.length) : questionGroup.list.slice(beginSplitNo, endSplitNo);
                    if (questionGroup.type == 'Article') {
                        splitList = i == separateIndex.length - 1 ? [{
                            ...questionGroup.list[0],
                            optionNum: questionGroup.list[0].optionNum - beginSplitNo,
                            originOptionNum: questionGroup.list[0]['optionNum']
                        }] : [{
                            ...questionGroup.list[0],
                            optionNum: endSplitNo - beginSplitNo,
                            originOptionNum: questionGroup.list[0]['optionNum']
                        }]
                    }
                    let nextQuestionGroup = {
                        ...questionGroup,
                        list: splitList,
                        title: separateIndex[0] == 0 && i == 0 ? questionGroup.title : '',
                    }
                    if (!pageDataList[curPageIndex]) {
                        pageDataList[curPageIndex] = [];
                    }
                    pageDataList[curPageIndex].push(nextQuestionGroup);
                    //最后一部分页码无需增加
                    if (i != separateIndex.length - 1) {
                        curPageIndex++;
                    }
                    beginSplitNo = endSplitNo;
                    curEndIndex = separateIndex[i + 2] ? separateIndex[i + 2] : questionGroup.rowGroupList.length;

                }
            }
        }
    }
    return {
        pageDataList,
        surplusHeight
    };
}

/**
 * @description 判断页面是否还能容纳该行题目
 * @param {number} surplusHeght 当前页面剩余高度
 * @param {object|Array} rowData 通过restructData方法重构之后的数据
 * @param {object} data 大题数据
 * @param {number} [displayType] 客观题排序方式（1：竖排，2：横排）
 * @param {number} [firstSurplusHeght] 解答题第1小题无法容纳题干与1行的高度时传入此值，该值应为页面高度减去题干高度即pageHeight-50
 * @returns {object} 返回判断结果，height为题目高度，isContain为当前题目/列是否能够容纳，AnswerLineHeightArr解答题小题行分割数组
 **/
export const checkIsPageContain = (surplusHeght, rowData, data, displayType = 2, firstSurplusHeght = 0) => {
    let AnswerLineHeightArr = [];
    let pageHight = mmWidth * 257;
    let height = 0;
    let nextHeight = 0;
    switch (data.type) {
        case 'Single':
        case 'Multiple':
        case 'Judgment':
            //该行只有一组题目时
            if (rowData.length == 1) {
                height = (rowData[0].length * 22) + 20;
            } else {
                height = (data.showNum * 22) + 20;
            }
            //客观题竖排列时
            if (displayType == 1) {
                let RowMaxShowNum = 0;
                rowData.forEach((arr) => {
                    arr.forEach((ques) => {
                        if (ques.optionNum > RowMaxShowNum) {
                            RowMaxShowNum = ques.optionNum;
                        }
                    })
                })
                height = (RowMaxShowNum + 1) * 18 + 20;
            }
            break;
        case 'Completion':
            if (rowData.length == 1) {
                height = Math.ceil(rowData[0]['optionNum'] / data.showNum) * 35;
            } else {
                height = 35;
            }
            break;
        case 'Other':
        case 'OptionalQues':
        case 'Answer':
            let maxContainLine = Math.floor(pageHight / 30);
            let maxContainLine2 = Math.floor(firstSurplusHeght / 30);
            // console.log(surplusHeght);
            for (let i = 1; i <= rowData.optionNum; i++) {
                let len = AnswerLineHeightArr.length;
                let curSum = AnswerLineHeightArr.reduce((p, v) => p + v, 0);
                if (i * 30 > surplusHeght && len == 0) {
                    AnswerLineHeightArr.push(i - 1);
                } else if (i - curSum > maxContainLine && len > 0) {
                    if (firstSurplusHeght != 0 && AnswerLineHeightArr.length == 1) {
                        AnswerLineHeightArr.push(maxContainLine2);
                    } else {
                        AnswerLineHeightArr.push(maxContainLine);
                    }
                }
                let nextSum = AnswerLineHeightArr.reduce((p, v) => p + v, 0);
                if (i == rowData.optionNum && AnswerLineHeightArr.length > 0 && nextSum != rowData.optionNum) {
                    let lastLineCount = i - nextSum;
                    if (lastLineCount > maxContainLine) {
                        lastLineCount = maxContainLine;
                    }
                    if (firstSurplusHeght != 0 && AnswerLineHeightArr.length == 1 && lastLineCount > maxContainLine2) {
                        AnswerLineHeightArr.push(maxContainLine2);
                        AnswerLineHeightArr.push(lastLineCount - maxContainLine2);
                    } else {
                        AnswerLineHeightArr.push(lastLineCount);
                    }
                }
                //该小题不分页
                if (i == rowData.optionNum && AnswerLineHeightArr.length == 0) {
                    AnswerLineHeightArr.push(i);
                }
            }
            nextHeight = AnswerLineHeightArr[AnswerLineHeightArr.length - 1] * 30;
            height = rowData.optionNum * 30;
            break;



        case 'Article':
            height = 40;
            break;
    }
    if (surplusHeght - height >= 0) {
        return {
            height,
            isContain: true,
            AnswerLineHeightArr
        }
    } else {
        return {
            height: data.type == 'Answer' || data.type == 'Other' || data.type == 'OptionalQues' ? nextHeight : height,
            isContain: false,
            AnswerLineHeightArr
        }
    }
}

/**
 * @description 获取题目分数描述字符串
 **/
export const getQuestionScoreDesc = (data) => {
    let str = '';
    let allSetting = data.list.every(item => item['score'] != 0);
    if (!allSetting) {
        return str;
    }
    switch (data.type) {
        case 'Single':
        case 'Multiple':
        case 'Judgment':
        case 'Completion':
        case 'Other':
        case 'OptionalQues':
        case 'Answer':
            let totalScore = 0;
            let isSameScore = false;
            if (data.list.length > 0) {
                isSameScore = data.list.every(item => item['score'] == data.list[0]['score']);
            }
            data.list.forEach((item) => {
                totalScore += (+item.score);
            })
            if (isSameScore && data.type != 'Answer' && data.type != 'Other' && data.type != 'OptionalQues') {
                str = `（每小题${data.list[0]['score']}分，共${totalScore}分）`
            } else {
                str = `（共${totalScore}分）`
            }
            break;

        case 'Article':
            str = data.list[0]['score'] == 0 ? '' : `（${data.list[0]['score']}分）`
            break;
    }
    return str;
}

/**
 * @description 题目渲染方法
 * @param {object} data 大题数据
 * @param {number} columns 答题卡栏数
 * @param {number} displayType 客观题排序方式（1：竖排，2：横排）
 * @param {function|''} changeAnswerHeight 解答题改变行高的回调方法(有这个值时出现输入框，无则不出现)
 * @returns {React.ReactNode} 返回题目渲染节点
 **/
export const renderQuestion = (data, columns = 1, displayType = 2, changeAnswerHeight = '', pageData = {}, _index = 0) => {
    if (!mmWidth || mmWidth < 1) {
        mmWidth = getOneMmsPx();
    }
    let charArr = [];
    switch (data.type) {
        case 'Single':
        case 'Multiple':
        case 'Judgment':
            charArr = data.type == 'Judgment' ? ['T', 'F'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
            let rowGroupList = restructData(data, data.type, columns, displayType);
            let lastLength = data.showNum;
            if (rowGroupList[rowGroupList.length - 1] && rowGroupList[rowGroupList.length - 1]['length'] == 1) {
                lastLength = rowGroupList[rowGroupList.length - 1][0]['length'];
            }
            return (
                <div className="question-groups-wrapper">
                    {rowGroupList.map((rowList, idx) => {
                        return (
                            <div className={displayType == 1 ? "row-list vertical" : "row-list"} key={idx}>
                                {rowList.map((group, index) => {
                                    return (
                                        <React.Fragment key={index}>
                                            {Array.from(Array((idx == rowGroupList.length - 1 ? lastLength : data.showNum)), (v, k) => k).map((v, i) => {
                                                return (
                                                    <div className="item-position-point" style={{ top: `${16 + i * 22}px` }} key={i}></div>
                                                )
                                            })}
                                            <div className="question-group" key={index}>
                                                {
                                                    group.map((item, _index) => {
                                                        return (
                                                            <div className="question-item" key={_index}>
                                                                <div className="question-item-no">{item.QuesNO}</div>
                                                                <div className="char-wrapper">
                                                                    {charArr.slice(0, item.optionNum).map((charItem, idx) => {
                                                                        return (
                                                                            <div className="char-item" key={charItem}>
                                                                                <span>[</span>
                                                                                {data.type === 'Judgment' && data.QuesGroupExtraParam === '1' && idx === 0 ? <span>√</span> : data.type === 'Judgment' && data.QuesGroupExtraParam === '1' && idx === 1 ? <span>×</span> : <span>{charItem}</span>}

                                                                                <span>]</span>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            )
        case 'Completion':
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
                // pageData[index][_index].list[idx2] = item;
                // pageData[index][_index].rowGroupList[idx2] = item;
                // setshowPageDataList(JSON.parse(JSON.stringify(pageData)));
                // console.log(value, item, i, 213123);
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
                                                       <div className="blank-wrapper" key={i} style={{ width: item.QuesExtraParam && item.QuesExtraParam.split(',')[i] ? `${item.QuesExtraParam.split(',')[i] * 25 + 35}px` : `calc(${renderWidth}px / ${data.showNum})`, maxWidth: '100%' }}>
                                                                <div className="item-no">
                                                                    <span>{i == 0 && `${item.QuesNO}、`}</span>
                                                                </div>
                                                                <u className="blank-item" style={{ msFlex: 1 }}></u>
                                                            </div>
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
        case 'Other':
        case 'OptionalQues':
        case 'Answer':
            // let borderStyleMap = {
            //     ['start'+(data.list.length-1)]: {borderBottom:'1px solid #e44c5d'},
            //     ['middle0']: {borderTop:'1px solid #e44c5d'},
            //     ['middle'+(data.list.length-1)]: {borderBottom:'1px solid #e44c5d'},
            //     ['end0']: {borderTop:'1px solid #e44c5d'}
            // }
            return (
                <div className="answer-question-wrapper">
                    {
                        data.list.map((item, index) => {
                            return (
                                <div
                                    className="answer-question-item"
                                    style={{ height: item.optionNum * 30 + 'px' }}
                                    key={index}
                                    data-no={item.QuesNO}
                                >
                                    {!item.hiddenNo && <span>{item.QuesNO}、{item.score != 0 ? `(${item.score}分)` : ''}</span>}
                                    {changeAnswerHeight && !item.hiddenNo &&
                                        <div className="answer-height-input-div">
                                            <span className="answer-Pic"><i></i>上传图片</span>
                                            <span>高 </span>
                                            <Input
                                                className="answer-height-input"
                                                maxLength={2}
                                                type="number"
                                                value={item.originOptionNum || item.optionNum}
                                                onChange={(e) => { changeAnswerHeight(e, data.NO - 1, item.quesIndex, index) }}
                                            ></Input>
                                            <span> 行</span>
                                        </div>
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            )
        case 'Article':
            let blockNum = 20;
            if (columns == 3) {
                blockNum = 15;
            }
            let LastCount = 0;
            if (_index !== 0) {
                pageData.map((item, idx) => {
                    if (idx < _index) {
                        item.map((it) => {
                            if (it.NO === data.NO) {
                                LastCount += blockNum * it.list[0].optionNum
                            }
                        })


                    }
                })
            }
            return (
                <div className="article-question-wrapper" style={data.showNum == 1 ? {} : { padding: '20px 0px 15px' }}>
            
                    {
                        Array.from(Array(data.list[0].optionNum), (v, k) => k).map((item, index) => {
                            return (
                                <div className="article-line" key={index}>
                                    {data.showNum == 1 ?
                                        <u style={{ msFlex: 1 }}></u>
                                        :
                                        <>
                                            {(new Array(blockNum)).fill(1).map((b, i) => {
                                                return (
                                                    <div className="article-line-block" style={{ msFlex: 1 }} key={i}>
                                                        {/* {index * blockNum + i + 1 + LastCount} */}
                                                        {(data.list[0].QuesExtraParam && data.list[0].QuesExtraParam.split('%')[1] * 1 === (index * blockNum + i + 1 + LastCount)) || (index * blockNum + i + 1 + LastCount) % 200 === 0 ? <span className="article-question-wordCount">
                                                            <i></i>{index * blockNum + i + 1 + LastCount}
                                                        </span> : ''}
                                                    </div>
                                                )
                                            })}
                                        </>
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            )
        case 'Comprehensive':
            return (
                <div className="comprehensive-question-wrapper">
                    {data.childQuesGroupList.map((quesGroupItem, index) => {
                        return (
                            <div className="comprehensive-question-item" key={index}>
                                {renderQuestion(quesGroupItem)}
                            </div>
                        )
                    })}
                </div>
            )
        default:
            return ''
    }
}