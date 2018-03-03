const soap = require('soap');
const config = require('../config');

const resort_args = {
    credentials: config.credentials,
    schemeStatus: config.resort_schemeStatus,
};

function getDateOfDay(type) {
    const day = 86400000;
    let now = new Date();
    if (type === 0) return now.getDate();
    if (type === 1) {
        if (now.getDay()===0)
            return now;
        else
            return now - (now.getDay()*day) ;
    }
    if (type === 3) {
        if (now.getMonth()<8) return 1;
        if (now.getMonth()>=8) return 0;
    }
};
function getUnitsInline(tabs, id) {
    for ( let i in tabs ){
        if (tabs[i].tabId == id){
            return tabs[i].units_in_line;
        }
    }
};
function getUnitsInlineList(tabs, idList) {
    let arr =[];
    for( let j in idList)
        for ( let i in tabs ){
            if (tabs[i].tabId == idList[j]){
                arr.push( tabs[i].units_in_line);
            }
        }
    return arr;
};
function getTopMenuView(period, competitionId_linkpart, type) {
    let link1, link2, link3;
    if (period==='0') link1 = 'active';
    if (period==='1') link2 = 'active';
    if (period==='3') link3 = 'active';
    return `
            <nav>
                <div class="item ${ link1 } first"><a href="${'/'+type+'/0/'+ competitionId_linkpart}">Today</a></div>
                <div class="item ${ link2 }"><a href="${  '/'+type+'/1/'+ competitionId_linkpart}">The week</a></div>
                <div class="item ${ link3 } last"><a href="${  '/'+type+'/3/'+ competitionId_linkpart}">Season</a></div>
            </nav>
        `
}
function getAwardsListView(tabs, period, competitionId) {
    let str='';
    for ( let i in tabs ){
        let active='';
        if (competitionId === tabs[i].tabId) active='active';
        str += `
            <div class="item ${active}" id="${tabs[i].tabId}">
                <a href="/list/${period}/${tabs[i].tabId}/" id="${tabs[i].tabId}" >
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


async function getResort(result, express_req, express_res, type) {
    soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
        client.getSkiAreasJSON(resort_args,  function(err, result2) {
            let data='';
            let arr = result2.return
            try { arr = JSON.parse(arr) }catch (e){console.log(e)};
            for ( let i in arr)
                if (arr[i].subAreas != '')
                    if (arr[i].subAreas != null)
                        data+=arr[i].name+': '+arr[i].subAreas+' <br />';

            if (type === 'list'){
                let period = express_req.params.period;
                let competitionId = express_req.params.competitionId;
                let tabs = config.tabs;
                express_res.render('../view/'+type+'.hbs', {
                    title: config.title,
                    popup_categories_count: (config.popup_categories_count) ? config.popup_categories_count : 0 ,
                    period: period,
                    TopMenuView: getTopMenuView(period, competitionId, type),
                    PlayersListView: getPlayersListView( result.return, getUnitsInline(tabs, competitionId) ),
                    AwardsListView: getAwardsListView( tabs, period, competitionId),
                    CategoriesListView: getCategoriesListView(tabs),
                    data: data
                });
            }

            if (type==='fs_list'){
                let period = express_req.params.period;
                let competitionIdList = express_req.params.competitionIdList.split('_');
                let tabs = config.tabs;
                express_res.render('../view/'+type+'.hbs', {
                    title: config.title,
                    period: period,
                    TopMenuView: getTopMenuView(period, express_req.params.competitionIdList, type),
                    // PlayersListView: result.return,
                    FSPlayersListView: getFSPlayersListView(tabs, competitionIdList, result.return, getUnitsInlineList(tabs, competitionIdList) ),
                    data: data
                });
            }

        });
    });
}



module.exports = {
    soap_request(args, express_req, express_res, type) {
        soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
            client.getCompetitionDataJSON(args, function(err, result) {
                if (err) console.log(err);
                getResort(result, express_req, express_res, type);
            });
        });
    },
    soap_request_for_many(args, express_req, express_res, type){
        console.log(args.competitionIdsJSON);
        soap.createClient(config.url, config.wsdlOptions,  function(err, client) {
            client.getCompetitionDataJSON2(args, function(err, result) {
                if (err) console.log(err);
                getResort(result, express_req, express_res, type);
            });
        });
    },
    getStrDate(type) {
        let now = new Date();
        if (type === 0) return now.getFullYear() +'-0'+ now.getMonth() +'-'+ getDateOfDay(type);
        if (type === 1) {
            let v = getDateOfDay(type)
            v = new Date(v);
            if (v < 1)
                return now.getFullYear() +'-0'+ now.getMonth()-1 +'-'+ v.getDate();
            else
                return now.getFullYear() +'-0'+ now.getMonth() +'-'+ v.getDate();
        }
        if (type === 3){
            if ( getDateOfDay(type) === 0 )
                return now.getFullYear() +'-08-01';
            if ( getDateOfDay(type) === 1 )
                return now.getFullYear()-1 +'-08-01';
        }
    },
    getValid_competitionIdList(str){
        let arr = str.split('_');
        for (let i in arr)
            arr[i]=parseInt(arr[i]);
        return JSON.stringify(arr)
    }
}