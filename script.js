console.log('-----');

let jsonData;
let isFileLoaded = false;
let innerJsonData = new Object();
let nowTimeDisplay = document.querySelector('p#nowTimeDisplay');
let showAllInfo = false;
let nowTimeSec = 0;
let sortNumArray = [];

// 現在時刻を更新する
function updateClock() {
	let timeOffset = -7;
	let now = new Date();
	let hours = now.getHours() - timeOffset;
	if(hours < 3) hours += 24;
	hours = hours.toString().padStart(2, '0');
	let minutes = now.getMinutes().toString().padStart(2, '0');
	let seconds = now.getSeconds().toString().padStart(2, '0');
	let timeString = '現在時刻：' + hours + ':' + minutes + ':' + seconds;
	nowTimeDisplay.textContent = timeString;
	nowTimeSec = +hours * 3600 + +minutes * 60 + +seconds;
	if(nowTimeSec < 10800) nowTimeSec += 86400;
}
// 最初に1回表示を更新
updateClock();
// 1秒ごとに表示を更新
setInterval(updateClock, 1000);

function readFile(fileName) {
	console.log(fileName + '.jsonを開きます');
	$('selectProjects').setAttribute('style', 'display:none');

	// XMLHttpRequestオブジェクトを作成
	var xhr = new XMLHttpRequest();

	// リクエストをオープン
	xhr.open('GET', fileName + '.json', true);

	// レスポンスのタイプをJSONに設定
	xhr.responseType = 'json';

	// レスポンスの受信が完了した場合の処理を定義
	xhr.onload = function () {
		if (xhr.status === 200) {
			// レスポンスが成功した場合、変数jsonDataに格納
			jsonData = xhr.response;
			console.log(jsonData);
			makeTableData();
		} else {
			// レスポンスが失敗した場合、エラーメッセージを表示
			console.log('Error: ' + xhr.status);
		}
	};
	// リクエストを送信
	xhr.send();
}

// JSONデータを内部データに変換する
function makeTableData() {
	$('title').innerText = jsonData.title + ' の運用表';

	innerJsonData.operations = new Array();
	for (let i = 0; i < jsonData.operations.length; i++) {
		const operation = jsonData.operations[i];
		let newOperation = new Object();
		newOperation.opNum = operation.opNum;
		newOperation.courseNum = operation.courseNum;
		newOperation.type = operation.type;
		newOperation.destination = operation.direction + '・' + operation.destination;
		newOperation.crew = operation.crew;
		newOperation.delay = 0;
		newOperation.nowStat = '';
		newOperation.nowGoing = false;
		newOperation.timetable = new Array();
		for (let j = 0; j < operation.timetable.length; j++) {
			const stats = operation.timetable[j];
			let newStats = new Object();
			let time = time2sec(stats.time);
			if(time < 10800) time += 86400;
			newStats.time = time;
			newStats.status = stats.status;
			newOperation.timetable.push(newStats);
		}
		innerJsonData.operations.push(newOperation);
		sortNumArray.push(i);
	}
	isFileLoaded = true;
	console.info('内部データを生成しました！');
	// console.log(JSON.stringify(innerJsonData));
	jsonData = '';
	// console.log(jsonData + '←jsonData');
	refreshTable();
	$('tables').removeAttribute('style');
}

let opTable = $('opTable');
let prevSortSet = [0, 'z2a'];
let sortSet = [0, 'z2a'];
const column = ['opNum', 'courseNum', 'type', 'destination', 'crew', 'nowStat', 'delay'];
const columnJP = ['運用番号', '行路番号', '種別', '行先', '担当', '現在の状態', '遅れ']

function refreshTable(){
	if(!isFileLoaded) return;
	console.log('表を更新します');
	// console.log(opTable.rows[0]);
	opTable.innerHTML = opTable.rows[0].innerHTML;
	// ここで2行目以降を削除

	// console.log(sortSet) // ソート設定

	let sortTheme = column[sortSet[0]]
	// console.log('でソートします：' + sortTheme) // ソートするテーマ

	// インデックスとソート要素を紐づけた配列を作成する
	let sortData = [];
	for (let i = 0; i < innerJsonData.operations.length; i++) {
		sortData.push({index: sortNumArray[i], value: innerJsonData.operations[sortNumArray[i]][sortTheme]});
		// console.log({index: sortNumArray[i], value: innerJsonData.operations[sortNumArray[i]][sortTheme]});
	}

	// 順番に基づいて並べ替える
	sortData.sort(function(a, b){
		if(sortSet[1] == 'a2z'){
			if (a.value < b.value) return -1;
			if (a.value > b.value) return 1;
			return 0;	 
		}else{
			if (a.value < b.value) return 1;
			if (a.value > b.value) return -1;
			return 0;	 
		}
	})

	// 要素番号配列を作成する
	sortNumArray = [];
	for(let i = 0; i < sortData.length; i++){
		sortNumArray.push(sortData[i].index);
	}
	// console.log(sortNumArray);

	console.log('現在時刻：' + nowTimeSec);
	// これをもとに表を生成する
	let tableData = '';
	for(let i = 0; i < sortNumArray.length; i++){
		const operation = innerJsonData.operations[sortNumArray[i]];

		//ここで現在の状態と次の予定を取得する
		let nowStatus = '';
		let nextStatus = '';
		for(let j = 0; j < operation.timetable.length; j++){
			const timetable = operation.timetable[j];
			// console.log('運番：' + operation.opNum + ', 項目番号：' + j + ', 予定時刻：' + timetable.time);

			// 文字列形式の時刻を用意
			let fromTimeStr = sec2time(timetable.time);
			fromTimeStr = fromTimeStr[0] + ':' + fromTimeStr[1] + ':' + fromTimeStr[2];

			// 予定時刻が現在時刻より前かどうか
			if(nowTimeSec <= timetable.time){
				if(j == 0){
					// 運用開始前
					// console.log('運用開始前です');
					nowStatus = '';
					nextStatus = fromTimeStr + ' ' + operation.timetable[0].status;
					if(timetable.time - nowTimeSec < 600){
						// 運用開始10分前なら表示
						innerJsonData.operations[sortNumArray[i]].nowGoing = true;
					}else{
						innerJsonData.operations[sortNumArray[i]].nowGoing = false;
					}
					break;
				}
			}else if(j < operation.timetable.length - 1){
				// Jが末尾でなく、次の予定を迎えていない
				// console.log('運用中です');
				if(nowTimeSec < operation.timetable[j + 1].time){
					let toTimeStr = sec2time(operation.timetable[j + 1].time);
					toTimeStr = toTimeStr[0] + ':' + toTimeStr[1] + ':' + toTimeStr[2];
					// console.log('現在に当てはまっています');
					nowStatus = fromTimeStr + ' ' + timetable.status;
					nextStatus = toTimeStr + ' ' + operation.timetable[j+1].status;
					innerJsonData.operations[sortNumArray[i]].nowStat = nowStatus;
					innerJsonData.operations[sortNumArray[i]].nowGoing = true;
					// console.log('innerJsonData:' + sortNumArray[i] + 'が更新されました' + innerJsonData.operations[sortNumArray[i]].nowStat);
					// console.log(innerJsonData);
					break;
				}
			}else{
				// jが末尾
				// console.log('現在が最後の予定です');
				nowStatus = fromTimeStr + ' ' + timetable.status;
				innerJsonData.operations[sortNumArray[i]].nowStat = nowStatus;
				nextStatus = '運用終了';
				// console.log(nowTimeSec - timetable.time);
				if(nowTimeSec - timetable.time > 600){
					//大幅に時間を過ぎている場合(10分)
					innerJsonData.operations[sortNumArray[i]].nowGoing = false;
				}else{
					innerJsonData.operations[sortNumArray[i]].nowGoing = true;
				}
				break;
			}
		}

		if(innerJsonData.operations[sortNumArray[i]].nowGoing || showAllInfo){
			tableData 
				+= '<tr><td>' + operation.opNum + '</td>'
				+ '<td>' + operation.courseNum + '</td>'
				+ '<td>' + operation.type + '</td>'
				+ '<td>' + operation.destination + '</td>'
				+ '<td>' + operation.crew + '</td>'
				+ '<td>' + nowStatus + '</td>'
				+ '<td>' + nextStatus + '</td>'
				+ '<td><input class="delayBtnA" type="button" value="1分回復" onclick="addDelay('+ sortNumArray[i] +', -1)"></td>'
				+ '<td>' + operation.delay + '分</td>'
				+ '<td><input class="delayBtnB" type="button" value="1分遅れ" onclick="addDelay('+ sortNumArray[i] +', 1)"></td>';
		}
	}

	// 表に内容を反映する
	opTable.innerHTML += tableData;
}
// 自動更新を行う
setInterval(refreshTable, 5000);

// 並べ替え設定を更新する
changeSortPos(0);
function changeSortPos(value){
	prevSortSet[0] = sortSet[0];
	prevSortSet[1] = sortSet[1];
	sortSet[0] = value;
	for(let i = 0; i < column.length; i++){
		$('switchBtn_' + i).removeAttribute('style');
		$('switchBtn_' + i).value = columnJP[i];
	}
	if(prevSortSet[0] == value){
		// 同じ列がクリックされた場合、昇順/降順を切り替える
		if(prevSortSet[1] == 'a2z'){
			sortSet[1] = 'z2a';
			$('switchBtn_' + value).value = columnJP[value] + '▼';
		}else{
			sortSet[1] = 'a2z'
			$('switchBtn_' + value).value = columnJP[value] + '▲';
		}
	}else{
		// 別の列がクリックされた場合、必ず昇順にする
		sortSet[1] = 'a2z'
		$('switchBtn_' + value).value = columnJP[value] + '▲';
	}
	$('switchBtn_' + value).setAttribute('style', 'background:#06f;color:white;');

	refreshTable()
}

// 表示オプションを切り替える
changeShowOption(false);
function changeShowOption(value){
	showAllInfo = value;
	console.log('全運用を表示する：' + value);
	if(value){
		$('showPart').removeAttribute('disabled');
		$('showAll').setAttribute('disabled', 'true');
	}else{
		$('showPart').setAttribute('disabled', 'true');
		$('showAll').removeAttribute('disabled');
	}
	refreshTable();
}

// 遅延を制御する
function addDelay(operation, value){
	innerJsonData.operations[operation].delay += value;
	for(let i = 0; i < innerJsonData.operations[operation].timetable.length; i++){
		innerJsonData.operations[operation].timetable[i].time += value * 60;
	}
	refreshTable();
}

function time2sec(time) {
	// console.log(time);
	let result = time[0] * 3600 + time[1] * 60 + time[2];
	if(result < 10800) result += 86400;
	return result;
}

function sec2time(timeSec){
	let sec = timeSec % 60;
	let min = (timeSec - sec)/ 60 % 60;
	let hour = (timeSec - sec - min * 60) / 3600;
	if(hour < 3) hour += 24;
	if(sec < 10) sec = '0' + sec;
	if(min < 10) min = '0' + min;
	return [hour, min, sec];
}

function $(elemId) {
	return document.getElementById(elemId);
}