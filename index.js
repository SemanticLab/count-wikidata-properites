const fs = require('fs')
const request = require('request')
const H = require('highland')
const wdk = require('wikidata-sdk')

var all_ids = ["Q1000534","Q1033084","Q1065628","Q1095414","Q1101593","Q1150630","Q1164505","Q1169918","Q1184107","Q1233711","Q1233935","Q1238872","Q1262225","Q1274075","Q1277181","Q1282347","Q1282480","Q1282700","Q1287751","Q1314531","Q1318323","Q1327228","Q1341386","Q1351751","Q1356445","Q13744765","Q1374647","Q1374878","Q1375571","Q1383538","Q1390629","Q1391952","Q1398257","Q1443275","Q1452605","Q1453285","Q1468356","Q1477606","Q1479471","Q1507190","Q1533654","Q15436878","Q15436880","Q15436883","Q15439780","Q15440534","Q15440666","Q15440737","Q15446173","Q1545418","Q15529203","Q1562348","Q1568121","Q15806199","Q15806846","Q15812795","Q15815145","Q15847400","Q15854683","Q1585801","Q1606560","Q1607849","Q16148038","Q161805","Q1682798","Q1683946","Q1685379","Q1688148","Q1690852","Q1691564","Q1699434","Q1700545","Q1701204","Q1702289","Q1702310","Q1702412","Q1702433","Q1703791","Q17323427","Q1738963","Q1739296","Q1740852","Q1740856","Q1779","Q1809225","Q1820383","Q18397237","Q18612929","Q18631875","Q1871516","Q1902146","Q1903806","Q1919779","Q1965475","Q1966092","Q19694519","Q198172","Q1994634","Q2061143","Q206466","Q20789723","Q2103942","Q2134079","Q2135920","Q2151526","Q21592133","Q2161188","Q2216655","Q2223686","Q2239470","Q22670605","Q2331937","Q2347112","Q2347149","Q2439546","Q2458381","Q2468145","Q254341","Q2545763","Q2547275","Q2549718","Q2636157","Q2639079","Q2651106","Q2654715","Q2725526","Q273076","Q283569","Q2846097","Q290129","Q290706","Q2927519","Q3020510","Q302676","Q304946","Q305330","Q3082911","Q3133028","Q313368","Q313519","Q313755","Q3181106","Q322760","Q326273","Q329362","Q330273","Q3372155","Q338698","Q3486894","Q350733","Q353269","Q353372","Q356176","Q362355","Q362769","Q367071","Q367447","Q367776","Q374629","Q376220","Q381716","Q38632","Q4285015","Q436176","Q439535","Q441902","Q443875","Q449040","Q449268","Q454819","Q456218","Q4709822","Q487021","Q487043","Q489579","Q490080","Q492247","Q497403","Q505105","Q5084800","Q5093772","Q5101081","Q511074","Q5244336","Q526552","Q530715","Q5371531","Q547132","Q5485819","Q5495796","Q5620939","Q5740151","Q588853","Q5970140","Q59907","Q599429","Q6074256","Q6080901","Q6415470","Q6524832","Q6554652","Q658015","Q658636","Q6686934","Q6686935","Q6687883","Q6697025","Q6752710","Q677598","Q6814179","Q705570","Q710357","Q713276","Q714277","Q7167411","Q7225888","Q723508","Q724080","Q725362","Q727418","Q730199","Q730718","Q737521","Q741759","Q7545974","Q7600260","Q7655300","Q773205","Q7961624","Q7964114","Q80634","Q80676","Q82470","Q847892","Q862492","Q895909","Q931021","Q931225","Q931607","Q938336","Q946236","Q963044","Q967230","Q977067","Q1035099","Q1095442","Q1287751","Q1356887","Q1443242","Q15843162","Q1607458","Q16089737","Q1740856","Q17626522","Q209586","Q2468145","Q2625389","Q265379","Q322308","Q355502","Q5539959","Q6223649","Q6317318","Q650006","Q7172631","Q7273400"]

var pLookup = {}
var pstats = {}

var download = function(id,callback){



		var url = wdk.getEntities({
		  ids: id,
		  languages: ['en'], // returns all languages if not specified
		  // props: ['labels','claims'], // returns all data if not specified
		  format: 'json' // defaults to json
		})


		request({
		    url: url,
		    method: 'GET',
		}, function(error, response, body) {
		    if (error) {
		        console.log(error);
		    } else {					    	
		    	data = JSON.parse(body)



	    		Object.keys(data.entities[id].claims).forEach((p)=>{
	    			if (!pstats[p]) pstats[p] = { count : 0, label: pLookup[p] }
	    			pstats[p].count++
	    		})

		    	console.log(url)
	
				callback(null,data)

		    }
		})

}




var counter = 0

request({
    url: "https://query.wikidata.org/sparql?query=SELECT%20%3Fproperty%20%3FpropertyLabel%20WHERE%20%7B%0A%20%20%20%20%3Fproperty%20a%20wikibase%3AProperty%20.%0A%20%20%20%20SERVICE%20wikibase%3Alabel%20%7B%0A%20%20%20%20%20%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%22%20.%0A%20%20%20%7D%0A%20%7D%0A%0A&format=json",
    method: 'GET',
}, function(error, response, body) {
    if (error) {
        console.log(error);
    } else {

    	data = JSON.parse(body)

    	data.results.bindings.forEach((b)=>{
    		var p = b.property.value.replace('http://www.wikidata.org/entity/','')
    		var l = b.propertyLabel.value
    		pLookup[p] = l
    	})

		H(all_ids)
			.map(H.curry(download))
		    .nfcall([])
		    .parallel(10)
		    .map(()=>{
		    
		    	if (++counter % 100 === 0) console.log(`\n\n\n\n${counter} / ${all_ids.length}\n\n\n\n`)
		    })
			.done(()=>{
	    	

				var items = Object.keys(pstats).map(function(key) {
				    return [key + ' -  ' + pstats[key].label, pstats[key].count];
				});

				// Sort the array based on the second element
				items.sort(function(first, second) {
				    return second[1] - first[1];
				});

				var results = {}

				items.forEach((i)=>{
					results[i[0]] = {count: i[1], percent: i[1]/all_ids.length*100}
				})

				fs.writeFileSync("results.json",JSON.stringify(results,null,2))




			})


    }
})




// H(all_people)
// 	.map()

// console.log(all_people)