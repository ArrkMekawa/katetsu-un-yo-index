# 芽河製作所 架鉄運用一覧(Web版)

> ## 命名規則

|通称|英称|
|:-:|:-:|  
|架鉄|katetsu|  

## 表示  

1. 現在の運用番号、行路番号、行先種別、走行区間、遅れの一覧表  
2. すべての行路番号と行先種別の一覧  
3. 担当別の現在の運用と次の運用の表示

## 読み込むJSONデータの構成  

	jsonData  
	\_title
	\_sections[]
		\_運用番号 opNum
			\_行路番号 courseNum
			\_種別 type
			\_上下 direction
			\_終着駅 destination
			\_タイムテーブル[] timetable
				\_時刻[時、分、秒] time
				\_ステータス status(A駅出発前/A→B走行中/B停車中/B入替待ち/B入替中 など)

## 内部でのJSONの構成  

	innerJsonData
	\_operations[]
		\_opNum
		\_courseNum
		\_type
		\_destination
		\_crew
		\_delay
		\_nowStat(変動)
		\_nextStat(変動)
		\_nowGoing(変動)
		\_timetable[]
			\_time
			\_status

現在時刻(秒表示)：nowTimeSec

## やること
- 特に無さそう
