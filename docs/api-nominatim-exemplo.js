/*
Requisição: 
    https://nominatim.openstreetmap.org/search.php?city=S%C3%A3o+Borja&state=RS&country=Brasil&format=jsonv2

Respostas:
*/
[{
"place_id":297829092,
"licence":"Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
"osm_type":"relation",
"osm_id":242294,
"boundingbox":["-29.082499",
"-28.3384988",
"-56.3249856",
"-55.2909708"],
"lat":"-28.6592237",
"lon":"-56.0044295",
"display_name":"São Borja, Região Geográfica Imediata de São Borja, Região Geográfica Intermediária de Uruguaiana, Rio Grande do Sul, Região Sul, 97670-000, Brasil",
"place_rank":16,
"category":"boundary",
"type":"administrative",
"importance":0.8001604254542792,
"icon":"https://nominatim.openstreetmap.org/ui/mapicons/poi_boundary_administrative.p.20.png"},
{"place_id":299049440,
"licence":"Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
"osm_type":"relation",
"osm_id":7390966,
"boundingbox":["-28.7115922",
"-28.5937932",
"-56.0503703",
"-55.9504423"],
"lat":"-28.65179055",
"lon":"-55.999520680545714",
"display_name":"São Borja, Região Geográfica Imediata de São Borja, Região Geográfica Intermediária de Uruguaiana, Rio Grande do Sul, Região Sul, 97670-000, Brasil",
"place_rank":18,
"category":"boundary",
"type":"administrative",
"importance":0.6100000000000001,
"icon":"https://nominatim.openstreetmap.org/ui/mapicons/poi_boundary_administrative.p.20.png"
}]

/*
Pegar o mapa do estado: (para cidades utilizar polygon_threshold=0.01)
Requsição:
    https://nominatim.openstreetmap.org/search.php?state=RS&country=Brasil&format=geojson&polygon_geojson=1&polygon_threshold=0.05

*/
let s = {"type":"FeatureCollection",
"licence":"Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
"features":[{"type":"Feature",
"properties":{"place_id":297226615,
"osm_type":"relation",
"osm_id":242620,
"display_name":"Rio Grande do Sul, Região Sul, Brasil",
"place_rank":8,
"category":"boundary",
"type":"administrative",
"importance":0.758254409824277,
"icon":"https://nominatim.openstreetmap.org/ui/mapicons/poi_boundary_administrative.p.20.png"},
"bbox":[-57.6489299,-33.8689056,-49.5306231,-27.0825356],
"geometry":{"type":"Polygon",
"coordinates":[[[-57.6489299,-30.1939068],[-57.5243102,-30.2856931],[-57.2208128,-30.2892782],[-57.0704506,-30.0863111],[-56.8077759,-30.1034774],[-56.0224069,-30.7856505],[-56.0097224,-31.0825954],[-55.6660666,-30.9539605],[-55.5772739,-30.8331089],[-55.3498108,-31.0392157],[-55.2400344,-31.2606156],[-55.0744594,-31.3321553],[-55.007233,-31.2669191],[-54.8365021,-31.4419535],[-54.5865499,-31.4565453],[-54.1001932,-31.9282448],[-53.9697222,-31.917655],[-53.7459872,-32.0784803],[-53.5832104,-32.451918],[-53.0755833,-32.7408806],[-53.5181889,-33.153425],[-53.5322824,-33.6888011],[-53.1810897,-33.8689056],[-52.4598638,-33.2536857],[-52.0611648,-32.3850439],[-51.1878545,-31.7764633],[-50.568982,-31.1983335],[-50.1734417,-30.642824],[-49.8256499,-29.865594],[-49.5306231,-29.4249416],[-49.912725,-29.2079236],[-50.114219,-29.2583704],[-50.1078756,-29.2802334],[-50.0548287,-29.3196855],[-50.032983,-29.3490038],[-50.0367776,-29.3518053],[-50.1749277,-29.2485769],[-49.9631899,-29.1176088],[-49.9349494,-28.7261536],[-49.8738975,-28.7449482],[-49.7842777,-28.6101723],[-49.6923192,-28.6267599],[-49.7656658,-28.4593171],[-50.1009081,-28.4861821],[-50.1280897,-28.4289207],[-50.1567591,-28.497997],[-50.6241743,-28.3925847],[-51.0845313,-27.8335933],[-51.6311074,-27.4883512],[-51.8922118,-27.5197319],[-52.0076608,-27.4050177],[-51.950666,-27.3812996],[-52.1640444,-27.274184],[-52.2114229,-27.3326055],[-52.2551966,-27.2567889],[-52.3726412,-27.3055865],[-52.4400759,-27.2158845],[-52.6941812,-27.284448],[-52.9526567,-27.1622891],[-52.9844141,-27.223517],[-53.0350542,-27.0825356],[-53.0753946,-27.1625945],[-53.3136621,-27.2195346],[-53.295874,-27.1348501],[-53.3718718,-27.0911021],[-53.6420346,-27.2207846],[-53.8692069,-27.1251561],[-54.0800592,-27.2982793],[-54.1852259,-27.264114],[-54.2815366,-27.4471837],[-54.4131896,-27.406528],[-54.5301959,-27.5065766],[-54.5816776,-27.4534145],[-54.6820516,-27.5746561],[-54.814,-27.533],[-54.9362521,-27.7718813],[-55.0839463,-27.7860224],[-55.0327577,-27.8567764],[-55.2048826,-27.861046],[-55.4449752,-28.0972084],[-55.775181,-28.2443815],[-55.6699096,-28.3308364],[-55.6963241,-28.4231562],[-55.8782951,-28.3611702],[-55.8823935,-28.477741],[-56.008687,-28.5060145],[-56.0075873,-28.6049306],[-56.294353,-28.7976933],[-56.4194797,-29.0789669],[-56.5914201,-29.1241797],[-56.9698405,-29.6415326],[-57.2419121,-29.7879367],[-57.3371279,-29.9928448],[-57.6489299,-30.1939068]]]}}]}