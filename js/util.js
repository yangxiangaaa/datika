// @ts-nocheck


export const PositionObjTemplate = {
    "Style": "",
    "Column": 1,
    "Size": [],
    "StudentID": [],
    "BarCode": [],
    "DiffPaper": [],
    "Single": [],
    "Multiple": [],
    "Judge": [],
    "Blank": [],
    "Solution": [],
    "Essay": [],
    "IDNumber": 6
}

export const QuestionTypeTextMap = {
    Single: '单选题',
    Multiple: '多选题',
    Judgment: '判断题',
    Completion: '填空题',
    Answer: '解答题',
    Article: '作文题',
    Comprehensive: '综合题',
    Other: '其他题型',
    OptionalQues: '选做题',
}

export const QuestionTypeMap = {
    "Single": "01",
    "Multiple": "02",
    "Judgment": "03",
    "Completion": "04",
    "Answer": "05",
    "Article": "06",
    "Comprehensive": "07",
    "Other": "99",
    "OptionalQues": '98',
}

export const QuestionTypeMap2 = {
    "01": "Single",
    "02": "Multiple",
    "03": "Judgment",
    "04": "Completion",
    "05": "Answer",
    "06": "Article",
    "07": "Comprehensive",
    "99": "Other",
    "98": "OptionalQues",
}

//阿拉伯数字转换为中文数字
export const numberToChinese = (num) => {
    var AA = new Array("零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十");
    var BB = new Array("", "十", "百", "千", "万", "亿", "点", "");
    var a = ("" + num).replace(/(^0*)/g, "").split("."),
        k = 0,
        re = "";
    for (var i = a[0].length - 1; i >= 0; i--) {
        switch (k) {
            case 0:
                re = BB[7] + re;
                break;
            case 4:
                if (!new RegExp("0{4}//d{" + (a[0].length - i - 1) + "}$")
                    .test(a[0]))
                    re = BB[4] + re;
                break;
            case 8:
                re = BB[5] + re;
                BB[7] = BB[5];
                k = 0;
                break;
        }
        if (k % 4 == 2 && a[0].charAt(i + 2) != 0 && a[0].charAt(i + 1) == 0)
            re = AA[0] + re;
        if (a[0].charAt(i) != 0)
            re = AA[a[0].charAt(i)] + BB[k % 4] + re;
        k++;
    }

    if (a.length > 1) // 加上小数部分(如果有小数部分)
    {
        re += BB[6];
        for (var i = 0; i < a[1].length; i++)
            re += AA[a[1].charAt(i)];
    }
    if (re == '一十')
        re = "十";
    if (re.match(/^一/) && re.length == 3)
        re = re.replace("一", "");
    return re;
}

//将一个数组等步长的子项组成新的子数组项
export const filterArrByGroup = (array, subGroupLength) => {
    let index = 0;
    let newArray = [];
    while (index < array.length) {
        newArray.push(array.slice(index, index += subGroupLength));
    }
    return newArray;
}

//数组展平
export function* flatten(arr) {
    for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            yield* flatten(arr[i])
        } else {
            yield arr[i]
        }
    }
}

//设置打印样式
export const cssPagedMedia = (function () {
    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    document.head.appendChild(style);
    return function (size) {
        style.innerHTML = '@page {size: ' + size + '}';
    };
}());

// 获取每毫米的像素值
export const getOneMmsPx = () => {
    // 创建一个1mm宽的元素插入到页面
    let div = document.createElement("div");
    div.id = "mm";
    div.style.width = "1mm";
    document.querySelector("body").appendChild(div);
    // 原生方法获取浏览器对元素的计算值
    let mm1 = document.getElementById("mm").getBoundingClientRect();
    setTimeout(() => {
        document.body.removeChild(div);
    })
    return mm1.width;
}

//base64转文件对象
export const dataURLtoFile = (dataurl, filename) => {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {
        type: mime
    });
}

export const testData = [{
    type: 'Comprehensive',
    title: '综合题',
    showNum: 2,   //每行的展示数
    optionNum: 2,
    list: [],
    childQuesGroupList: [{
        type: 'Single',
        title: '选择题',
        showNum: 2,   //每行的展示数
        optionNum: 2,
        list: [
            {
                QuesNO: 1,
                optionNum: 4,   //选项数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 2,
                optionNum: 4,   //选项数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 3,
                optionNum: 4,   //选项数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
        ]
    }, {
        type: 'Completion',
        title: '填空题',
        showNum: 2,   //每行的展示数
        optionNum: 2,
        list: [
            {
                QuesNO: 4,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 5,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 6,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 7,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 8,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }, {
        type: "Other",        //题目类型
        title: "其它题型",  //题目名称
        showNum: 1,    //每组题数(2~10)
        startIndex: 1,
        endIndex: 3,
        list: [
            {
                QuesNO: 9,
                optionNum: 3,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 10,
                optionNum: 4,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    },
    {
        type: "OptionalQues",        //题目类型
        title: "选做题",  //题目名称
        showNum: 1,    //每组题数(2~10)
        startIndex: 1,
        endIndex: 3,
        list: [
            {
                QuesNO: 9,
                optionNum: 3,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 10,
                optionNum: 4,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    },
    {
        type: "Answer",        //题目类型
        title: "解答题",  //题目名称
        showNum: 1,    //每组题数(2~10)
        startIndex: 1,
        endIndex: 3,
        list: [
            {
                QuesNO: 9,
                optionNum: 3,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 10,
                optionNum: 4,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }, {
        type: 'Completion',
        title: '填空题',
        showNum: 4,   //每行的展示数
        optionNum: 2,
        list: [
            {
                QuesNO: 11,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 12,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 13,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 14,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 15,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }]
}, {
    type: 'Completion',
    title: '填空题',
    showNum: 4,   //每行的展示数
    optionNum: 2,
    list: [
        {
            QuesNO: 16,
            optionNum: 2,   //填空数
            score: 2,        //分值
            answerValue: "A"      //答案值(多个值时以|分隔)
        },
        {
            QuesNO: 17,
            optionNum: 2,   //填空数
            score: 2,        //分值
            answerValue: "A"      //答案值(多个值时以|分隔)
        },
        {
            QuesNO: 18,
            optionNum: 2,   //填空数
            score: 2,        //分值
            answerValue: "A"      //答案值(多个值时以|分隔)
        },
        {
            QuesNO: 19,
            optionNum: 2,   //填空数
            score: 2,        //分值
            answerValue: "A"      //答案值(多个值时以|分隔)
        },
        {
            QuesNO: 20,
            optionNum: 2,   //填空数
            score: 2,        //分值
            answerValue: "A"      //答案值(多个值时以|分隔)
        }
    ]
}, {
    type: 'Comprehensive',
    title: '综合题',
    showNum: 2,   //每行的展示数
    optionNum: 2,
    list: [],
    childQuesGroupList: [{
        type: 'Single',
        title: '选择题',
        showNum: 2,   //每行的展示数
        optionNum: 2,
        list: [
            {
                QuesNO: 1,
                optionNum: 4,   //选项数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 2,
                optionNum: 4,   //选项数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 3,
                optionNum: 4,   //选项数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
        ]
    }, {
        type: 'Completion',
        title: '填空题',
        showNum: 2,   //每行的展示数
        optionNum: 2,
        list: [
            {
                QuesNO: 4,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 5,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 6,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 7,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 8,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }, {
        type: "Answer",        //题目类型
        title: "解答题",  //题目名称
        showNum: 1,    //每组题数(2~10)
        startIndex: 1,
        endIndex: 3,
        list: [
            {
                QuesNO: 9,
                optionNum: 3,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 10,
                optionNum: 4,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }, {
        type: "Other",        //题目类型
        title: "其它题型",  //题目名称
        showNum: 1,    //每组题数(2~10)
        startIndex: 1,
        endIndex: 3,
        list: [
            {
                QuesNO: 9,
                optionNum: 3,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 10,
                optionNum: 4,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }, {
        type: "OptionalQues",        //题目类型
        title: "选做题",  //题目名称
        showNum: 1,    //每组题数(2~10)
        startIndex: 1,
        endIndex: 3,
        list: [
            {
                QuesNO: 9,
                optionNum: 3,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 10,
                optionNum: 4,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }, {
        type: 'Completion',
        title: '填空题',
        showNum: 4,   //每行的展示数
        optionNum: 2,
        list: [
            {
                QuesNO: 11,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 12,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 13,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 14,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            },
            {
                QuesNO: 15,
                optionNum: 2,   //填空数
                score: 2,        //分值
                answerValue: "A"      //答案值(多个值时以|分隔)
            }
        ]
    }]
}]