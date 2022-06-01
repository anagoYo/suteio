function struct(func) {
    return function() {
        var f = new func();
        func.apply(f, arguments);
        return f;
    };
}

var MemberInfo = struct(function MemberInfo(name, curName, curServer) {
    this.name = name;
    this.curName = curName;
    this.curServer = curServer;
});

function getOnlineServer(json){
    included = json["included"];
    for (var i = 0; i < included.length; i++) {
        server = included[i];
        if(server["relationships"]["game"]["data"]["id"] != "rust"){
            continue;
        }
        if(String(server["meta"]["online"]) == "true"){
            return server["attributes"]["name"];
        }
    }
    return null;
}

const getMembers = () =>{
    return new Promise((resolve, reject)=>{
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://azarasi-0925.github.io/suteio/static/api/SuteioMembers.json");
        xhr.responseType = 'json';
        xhr.addEventListener('load', function() {
            console.log(xhr.response);
            resolve(xhr.response)
        });
        xhr.send(null);
    });
};

const getMemberInfo = (name, uid) => {
    return new Promise((resolve, reject)=>{
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.battlemetrics.com/players/"+uid+"?include=server&fields[server]=name");
        xhr.responseType = 'json';
        xhr.addEventListener('load', function() {
            const response = xhr.response;
            memberInfo = new MemberInfo(name, response.data.attributes.name, getOnlineServer(response));
            resolve(memberInfo);
        });
        xhr.send(null);
    });
};

const getMembersInfo = () =>{
    return new Promise((resolve, reject)=>{
        getMembers().then(members => {
            Promise.all(members.map(member => getMemberInfo(member.name, member.uid))).then(results => {
                resolve(results);
            })
        });
    });
}

function createChild(name, curName, curServer){
    let table = document.getElementById("members");
    let row = table.insertRow();
    let cell = row.insertCell();
    cell.appendChild(document.createTextNode(name));
    cell = row.insertCell();
    cell.appendChild(document.createTextNode(curName));
    cell = row.insertCell();
    cell.appendChild(document.createTextNode(curServer));
}

function updateList(){
    console.log("updateList");
    getMembersInfo().then(membersInfo => {
        membersInfo.forEach(function(elem, index){
            createChild(elem.name, elem.curName, elem.curServer);
        });
    });
}

window.onload = function(){
    updateList();
}
