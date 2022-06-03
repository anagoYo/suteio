function struct(func) {
    return function() {
        var f = new func();
        func.apply(f, arguments);
        return f;
    };
}

var PlayerInfo = struct(function PlayerInfo(uid, curName, curServer) {
    this.uid = uid;
    this.curName = curName;
    this.curServer = curServer;
});

function getUids(){
    csv = localStorage.getItem("uids");
    if(csv == null)
        return null;
    return csv.trim().split(",");
}

function uidExportDownload(){
    const uids = localStorage.getItem("uids");
    if(uids == null){
        alert("失敗");
        return null;
    }

    const element = document.createElement("a");
    element.href = URL.createObjectURL(new Blob([uids],{type: "text/plain"}));
    element.target = "_blank";
    element.download = "uid.csv";
    element.click();
    URL.revokeObjectURL(element.href);
    element.remove();
}

function createChild(uid, curName, curServer){
    let table = document.getElementById("list");
    let row = table.insertRow();
    let cell = row.insertCell();
    cell.appendChild(document.createTextNode(uid));
    cell = row.insertCell();
    cell.appendChild(document.createTextNode(curName));
    cell = row.insertCell();
    cell.appendChild(document.createTextNode(curServer));
}

function deleteList(){
    let table = document.getElementById("bo");
    if(table == null)
        return null;
    table.innerHTML = "";
}

function getOnlineServer(json){
    if(json == null)
        return null;
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

const getPlayerInfo = (uid) => {
    if (uid == null)
        return null;
    return new Promise((resolve, reject)=>{
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.battlemetrics.com/players/"+uid+"?include=server&fields[server]=name");
        xhr.responseType = "json";
        xhr.addEventListener("load", function() {
            const response = xhr.response;
            playerInfo = new PlayerInfo(uid, response["data"]["attributes"]["name"], getOnlineServer(response));
            resolve(playerInfo);
        });
        xhr.send(null);
    });
};

function updateList(){
    deleteList();
    uids = getUids();
    if(uids == null)
        return null;
    for (var uid of uids){
        getPlayerInfo(uid).then(playerInfo => {
            createChild(uid, playerInfo.curName, playerInfo.curServer);
        });
    }
}

function reset(){
    var result = window.confirm("読み込んだデータが全て削除されます。");
    if(result){
        localStorage.clear();
    }
}

window.onload = function() {
    // scvファイルの読み込み
    var input = document.getElementById("inputCsvFile");
    let reader = new FileReader();
    input.addEventListener("change", () => {
        for(file of input.files){
            reader.readAsText(file, "utf-8");
            reader.onload = ()=> {
                console.log("input:\n"+reader.result);
                localStorage.setItem("uids", reader.result);
                updateList();
            };
        }
    });

    updateList();
}