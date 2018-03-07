const soap = require('soap');
const config = require('../config');

const resort_args = {
    credentials: config.credentials,
    schemeStatus: config.resort_schemeStatus,
};
function renderPage(result, express_req, express_res, type, lastRequest, result_resort) {
    const tabs = config.tabs;
    let arr = []
    try {arr = JSON.parse(result_resort.return)} catch (e) {console.log(e) };
    const UnitsInline = getUnitsInline(tabs, express_req.params.competitionId);
    if (type === 'list') {
        express_res.render('../view/' + type + '.hbs', {
            title: config.title,
            tt: lastRequest.substr(0),
            popup_categories_count: (config.popup_categories_count) ? config.popup_categories_count : 0,
            period: express_req.params.period,
            competitionId: express_req.params.competitionId,
            resort: express_req.params.resort,
            unitsinline :UnitsInline,
            TopMenuView: getTopMenuView(express_req.params, type),
            PlayersListView: getPlayersListView(result.return,UnitsInline) ,
            AwardsListView: getAwardsListView(tabs, express_req.params),
            CategoriesListView: getCategoriesListView(tabs),
            ResortList: getResortList(arr),
            CurrentResort: getCurrentResort(express_req.params.resort, arr)
        });
    }

    if (type === 'fs_list') {
        express_req.params.competitionId = express_req.params.competitionIdList;
        let competitionIdList = express_req.params.competitionIdList.split('_');
        express_res.render('../view/' + type + '.hbs', {
            title: config.title,
            period: express_req.params.period,
            resort: express_req.params.resort,
            refreshTimeout: config.refreshTimeout,
            idList: competitionIdList,
            tabs: JSON.stringify(tabs),
            TopMenuView: getTopMenuView(express_req.params, type),
            FSPlayersListView: getFSPlayersListView(tabs, competitionIdList, result.return, getUnitsInlineList(tabs, competitionIdList)),
            ResortList: getResortList(arr),
            CurrentResort: getCurrentResort(express_req.params.resort, arr)
        });
    }
}

function validateDatetoStr(targetDate){
    let str ='' + targetDate.getFullYear()+'-';
    if ( (targetDate.getMonth()+1) >9 ) str+=(targetDate.getMonth()+1)+'-';
    else str+='0'+(targetDate.getMonth()+1)+'-';
    if (targetDate.getDate()>9 ) str+=targetDate.getDate();
    else str+='0'+targetDate.getDate();
    return str;
}
function getStrDate(type) {
    let targetDate = new Date();
    if (type === 0) {
        // Obtaining today's date.
        return validateDatetoStr(targetDate);
    }
    if (type === 1) {
        // Obtaining last sunday date.
        targetDate.setDate(targetDate.getDate() - (targetDate.getDay() + 7) % 7);
        return validateDatetoStr(targetDate);
    }
    if (type === 3) {
        // Obtaining 1.08 of the last year.
        return (targetDate.getMonth()>=8) ? targetDate.getFullYear()+'-08-01' : targetDate.getFullYear()-1+'-08-01';
    }
}

function getUnitsInline(tabs, id) {
    for ( let i in tabs )
        if (tabs[i].tabId === id)
            return tabs[i].units_in_line;
}

function getUnitsInlineList(tabs, idList) {
    let arr =[];
    for( let j in idList)
        for ( let i in tabs ){
            if (tabs[i].tabId === idList[j]){
                arr.push( tabs[i].units_in_line);
            }
        }
    return arr;
}

function getTopMenuView(params, type) {
    let link1, link2, link3;
    if (params.period==='0') link1 = 'active';
    if (params.period==='1') link2 = 'active';
    if (params.period==='3') link3 = 'active';
    return `
            <nav>
                <div class="item ${ link1 } first"><a href="/${type+'/0/'+ params.competitionId+'/'+params.resort}/">Today</a></div>
                <div class="item ${ link2 }"><a href="${ '/'+type+'/1/'+ params.competitionId+'/'+params.resort}/">The week</a></div>
                <div class="item ${ link3 } last"><a href="${ '/'+type+'/3/'+ params.competitionId+'/'+params.resort}/">Season</a></div>
            </nav>
        `
}
function getAwardsListView(tabs, params) {
    let str='';
    for ( let i in tabs ){
        let active='';
        if (params.competitionId === tabs[i].tabId) active='active';
        str += `
            <div class="item ${active}" id="${tabs[i].tabId}">
                <a href="/list/${params.period}/${tabs[i].tabId}/${params.resort}/" id="${tabs[i].tabId}" >
                    <img src="/img/${tabs[i].tabIcon}" alt="${tabs[i].tabname}">
                    <div class="description">
                        <div class="tit">${tabs[i].tabname}</div>
                        <div class="data">(${tabs[i].units})</div>
                    </div>
                </a>
            </div>
        `
    }
    return str;
}
function getCategoriesListView(tabs) {
    let str='';
    for ( let i in tabs ){
        str += `
            <div class="item" onclick="popupMenuCheck(this)" id="${tabs[i].tabId}" ><a  >
                <img src="/img/p_${tabs[i].tabIcon}" alt="${tabs[i].tabname}">
                <div class="name">${tabs[i].tabname}</div>
            </a></div>
        `
    }
    return str;
}
function getFSPlayersListView(tabs, idList, json, units_list) {
    let obj;
    try { obj = JSON.parse(json) } catch(e){console.log(e);}
    let str = '';
    for(let i in obj){
        for (let j in tabs)
            if (idList[i]==tabs[j].tabId)
                str+=getPlayerColumnView( obj[i] , tabs[j] )
    }
    return str;
}
function getPlayersListView(json, units) {
    let obj;
    try { obj = JSON.parse(json) } catch(e){console.log(e);}
    let str = '';
    let n=0;
    for(let i in obj){
        n++;
        str+=getPlayerRowView( obj[i] , units, n)
    }
    str += `</div>
    <div class="all_players">
        All players: ${n}
    </div>`;
    return str;
}
function getPlayerColumnView(obj, column_info) {
    let str = `        
        <div class="column">
            <div class="pic"><img src="/img/f_${column_info.tabIcon}" alt="${column_info.tabname}"/> </div>
            <div class="tit" style="color: ${column_info.color};">${column_info.tabname}</div>
            <div class="list">`;

    let n=0;
    for(let i in obj){
        n++;
        str+=getPlayerRowView( obj[i] , column_info.units_in_line, n)
    }
    str +=
        `<div class="more">
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="circle"></div>
                    </div>
            </div>
        </div>`;
    return str;
}
function getPlayerRowView(obj, units, id) {
    return `
        <div class="item">
            <div class="num">${id}</div>
            <!--<div class="pic"><img src="img/pic.png" alt=""></div>-->
            <div class="name">${obj.fbUserName}</div>
            <div class="dist">${ obj.criterion +' '+units }</div>
        </div>`
}

function getValid_competitionIdList(str){
    let arr = str.split('_');
    for (let i in arr)
        arr[i]=parseInt(arr[i]);
    return JSON.stringify(arr)
}

function getResortList(arr){
    let data='';
    for ( let i in arr)
        if (arr[i].subAreas != '')
            if (arr[i].subAreas != null)
                // data+=arr[i].name+': '+arr[i].subAreas+' <br />';
                data+=`
                    <div class="item" id="${arr[i].id}" onclick="resortCheck(this)" >
                        <div class="name">${arr[i].name}</div>
                        <div class="subAreas" style="display: none">${arr[i].subAreas}</div>
                    </div>`;

    return data;
}

function getCurrentResort(resort, arr) {
    for ( let i in arr)
        if (parseInt(resort) === arr[i].id)
            return arr[i].name+': '+arr[i].subAreas;
}
function renderJSON(result, express_req, express_res) {
    express_res.send(result.return)
}



async function getResort(result, express_req, express_res, type, lastRequest) {
    soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
        client.getSkiAreasJSON(resort_args,  function(err, result2) {
            renderPage(result, express_req, express_res, type, lastRequest, result2)
        });
    });
}


module.exports = {
    soap_request(express_req, express_res, type) {
        const part_of_date = getStrDate(  parseInt(express_req.params.period) )
        console.log(part_of_date);
        let args = {
            credentials:config.credentials,
            competitionId: express_req.params.competitionId,
            period: express_req.params.period,
            startFrom: part_of_date+'T15:20:54.120+04:00',
        };
        const resort = express_req.params.resort;
        if (resort !== '0') args.skiAreaId = resort;

        soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
            client.getCompetitionDataJSON(args, function(err, result) {
                if (err) console.log(err);
                getResort(result, express_req, express_res, type, client.lastRequest+' ');
            });
        });
    },
    soap_request_to_JSON(express_req, express_res, type){
        const part_of_date = getStrDate(  parseInt(express_req.params.period) )
        let args = {
            credentials:config.credentials,
            competitionId: express_req.params.competitionId,
            period: express_req.params.period,
            startFrom: part_of_date+'T15:20:54.120+04:00',
        };
        const resort = express_req.params.resort;
        if (resort !== '0') args.skiAreaId = resort;
        soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
            client.getCompetitionDataJSON(args, function(err, result) {
                if (err) console.log(err);
                renderJSON(result, express_req, express_res);
            });
        });
    },
    soap_request_for_many(express_req, express_res, type){
        const partofdate = getStrDate(  parseInt(express_req.params.period) )
        const valid_competitionIdList = getValid_competitionIdList(express_req.params.competitionIdList);
        const args = {
            credentials:config.credentials,
            competitionIdsJSON: valid_competitionIdList,
            period: express_req.params.period,
            startFrom: partofdate+'T15:20:54.120+04:00'
        };
        const resort = express_req.params.resort;
        if (resort !== '0') args.skiAreaId = resort;
        soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
            client.getCompetitionDataJSON2(args, function(err, result) {
                if (err) console.log(err);
                getResort(result, express_req, express_res, type);
            });
        });
    },
    soap_request_for_JSONmany(express_req, express_res, type){
        const partofdate = getStrDate(  parseInt(express_req.params.period) )
        const valid_competitionIdList = getValid_competitionIdList(express_req.params.competitionIdList);
        const args = {
            credentials:config.credentials,
            competitionIdsJSON: valid_competitionIdList,
            period: express_req.params.period,
            startFrom: partofdate+'T15:20:54.120+04:00'
        };
        const resort = express_req.params.resort;
        if (resort !== '0') args.skiAreaId = resort;
        soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
            client.getCompetitionDataJSON2(args, function(err, result) {
                if (err) console.log(err);
                renderJSON(result, express_req, express_res);
            });
        });
    }
}