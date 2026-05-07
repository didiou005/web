import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Polygon,
  Marker, 
  Popup, 
  useMapEvents 
} from 'react-leaflet';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { regionsService, communeService } from '../../services/api';
import { 
  Map as MapIcon, 
  Plus, 
  Save, 
  X, 
  Trash2, 
  Lock, 
  RefreshCw, 
  Info,
  Layers,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Fix icônes Leaflet par défaut
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CENTER_BOUIRA = [36.374, 3.896];
const BOUIRA_BOUNDS = [
  [35.75, 3.25], // Sud-Ouest étendu
  [36.75, 4.45]  // Nord-Est étendu
];

// Polygone officiel de la Wilaya de Bouira (données simplifiées)
const BOUIRA_WILAYA_GEOM = [[36.513771,3.293304],[36.507126,3.295619],[36.495358,3.299521],[36.495301,3.305773],[36.496075,3.312107],[36.491002,3.316624],[36.488161,3.319605],[36.484762,3.323385],[36.479662,3.328245],[36.477083,3.334748],[36.473585,3.341864],[36.47212,3.347697],[36.473245,3.35674],[36.470858,3.359797],[36.468718,3.361259],[36.4649,3.363162],[36.462092,3.366926],[36.455329,3.361632],[36.452468,3.372255],[36.447655,3.372863],[36.441524,3.373682],[36.434135,3.3761],[36.433674,3.384597],[36.427204,3.395272],[36.417058,3.405122],[36.416375,3.410593],[36.41166,3.416048],[36.407002,3.416378],[36.40537,3.422317],[36.4063235,3.4333825],[36.41076,3.429279],[36.414082,3.431427],[36.414483,3.439351],[36.413392,3.447374],[36.42302,3.450232],[36.429723,3.455383],[36.432244,3.463147],[36.435128,3.472568],[36.436715,3.483305],[36.44291,3.483131],[36.447082,3.475093],[36.449489,3.4839],[36.454769,3.492651],[36.45665,3.501943],[36.449032,3.504045],[36.445592,3.51134],[36.445481,3.520559],[36.43826,3.533017],[36.430352,3.54082],[36.430814,3.550549],[36.431211,3.564152],[36.422735,3.562634],[36.417429,3.564627],[36.409727,3.557059],[36.406233,3.54843],[36.404798,3.54404],[36.397563,3.547505],[36.390841,3.548811],[36.383544,3.554612],[36.3773,3.560015],[36.369049,3.567143],[36.361427,3.576632],[36.356332,3.586374],[36.35521,3.589024],[36.352895,3.590132],[36.348882,3.590419],[36.3447442,3.5825947],[36.3369502,3.5732307],[36.3370652,3.5683387],[36.3354632,3.5657087],[36.3330552,3.5680117],[36.3345472,3.5649577],[36.3360352,3.5605407],[36.3356912,3.5566327],[36.3321932,3.5530177],[36.3312822,3.5492817],[36.3253802,3.5389847],[36.318889,3.5351841],[36.3112442,3.5430776],[36.3062012,3.5433236],[36.2990372,3.5388606],[36.2895282,3.5351236],[36.2851602,3.5347006],[36.2811632,3.5333426],[36.2792742,3.5305626],[36.2784432,3.5266886],[36.2785762,3.5231156],[36.2772112,3.5192876],[36.2767492,3.5164456],[36.2765686,3.5185182],[36.2750766,3.5218012],[36.2746186,3.5255942],[36.2743896,3.5300232],[36.2716966,3.5338402],[36.2723836,3.5406692],[36.2699776,3.5465542],[36.2635036,3.5481412],[36.2593186,3.5501982],[36.2551386,3.5522792],[36.2499806,3.5563752],[36.2442516,3.5622022],[36.2361766,3.5675052],[36.2321096,3.5653772],[36.2280356,3.5647702],[36.2245986,3.5610912],[36.2191637,3.5590143],[36.2147405,3.5540791],[36.2081443,3.5561712],[36.20542,3.552151],[36.205263,3.539527],[36.199,3.526286],[36.200365,3.509144],[36.19892,3.505939],[36.198317,3.501562],[36.196768,3.498371],[36.194247,3.495712],[36.191439,3.489123],[36.187311,3.488235],[36.182673,3.48753],[36.179008,3.487931],[36.176315,3.485886],[36.159755,3.477859],[36.148926,3.486774],[36.140221,3.497329],[36.126756,3.500647],[36.120168,3.506376],[36.115812,3.502537],[36.11065,3.497507],[36.106298,3.491845],[36.11065,3.497507],[36.106298,3.491845],[36.100512,3.487823],[36.09828,3.478731],[36.094786,3.471465],[36.088484,3.464715],[36.082735,3.458897],[36.077082,3.450517],[36.068545,3.447337],[36.063385,3.437224],[36.060066,3.425856],[36.061785,3.411973],[36.066939,3.407051],[36.067286,3.401988],[36.064204,3.398117],[36.055576,3.4035],[36.046829,3.402685],[36.042072,3.409619],[36.036918,3.416391],[36.03365,3.428595],[36.034684,3.43958],[36.041272,3.449497],[36.039036,3.461679],[36.033906,3.466671],[36.033997,3.476307],[36.032731,3.487096],[36.031041,3.495458],[36.022707,3.511861],[36.025461,3.523085],[36.022764,3.53207],[36.016523,3.552112],[36.010852,3.55712],[36.004145,3.560038],[35.998419,3.559849],[35.995612,3.563837],[35.988448,3.564432],[35.97911,3.567486],[35.972152,3.570461],[35.969143,3.575124],[35.967418,3.579101],[35.965188,3.584527],[35.962239,3.590925],[35.955445,3.584899],[35.947713,3.588423],[35.937746,3.600703],[35.930307,3.608735],[35.916434,3.619542],[35.913813,3.616977],[35.912593,3.620453],[35.913913,3.626303],[35.914084,3.631797],[35.915976,3.633339],[35.917521,3.634302],[35.920073,3.633326],[35.921759,3.634047],[35.924364,3.636184],[35.927603,3.63645],[35.928175,3.635144],[35.931211,3.634376],[35.934248,3.63154],[35.942785,3.657559],[35.937753,3.701663],[35.936885,3.716014],[35.932013,3.718466],[35.927375,3.723263],[35.923247,3.726253],[35.916316,3.729978],[35.912479,3.73477],[35.909271,3.740847],[35.904972,3.742464],[35.903648,3.744522],[35.900505,3.748039],[35.900329,3.751424],[35.899009,3.753336],[35.897236,3.755965],[35.901764,3.7643],[35.901764,3.773066],[35.897904,3.773928],[35.897923,3.776863],[35.895917,3.781711],[35.893681,3.787211],[35.891679,3.793772],[35.888871,3.797777],[35.885144,3.799794],[35.879647,3.796001],[35.875463,3.791537],[35.86899,3.790523],[35.869619,3.794265],[35.867899,3.796517],[35.866468,3.797828],[35.866129,3.801697],[35.864294,3.799412],[35.861948,3.801182],[35.862745,3.803835],[35.860285,3.805348],[35.859655,3.809978],[35.856832,3.811924],[35.853522,3.814121],[35.856615,3.816693],[35.858755,3.817875],[35.861773,3.818768],[35.86223,3.820538],[35.864408,3.820808],[35.866243,3.829625],[35.864393,3.835659],[35.861948,3.839321],[35.856845,3.840312],[35.853293,3.842816],[35.853751,3.845686],[35.850257,3.850802],[35.852836,3.850676],[35.855014,3.851089],[35.858451,3.852373],[35.861774,3.856446],[35.861201,3.861098],[35.863494,3.865231],[35.865214,3.871218],[35.873289,3.892412],[35.876726,3.89208],[35.880625,3.894068],[35.885435,3.897523],[35.8894485,3.8984367],[35.8950065,3.9130027],[35.8910545,3.9208867],[35.8878425,3.9265717],[35.8925955,3.9376207],[35.8832605,3.9537647],[35.8749535,3.9677397],[35.8689375,3.9805927],[35.8664735,3.9917987],[35.8651535,3.9993567],[35.8629225,4.0087537],[35.8620605,4.0181847],[35.8594285,4.0273587],[35.8609735,4.0317077],[35.8685915,4.0318687],[35.8760405,4.0296457],[35.8826895,4.0299077],[35.8893345,4.0244297],[35.8947775,4.0235197],[35.9005685,4.0153887],[35.9047725,4.0121967],[35.9092735,4.0132227],[35.9131105,4.0117557],[35.9177525,4.0135427],[35.9206745,4.0186087],[35.9227915,4.0245817],[35.9310425,4.0254607],[35.9394165,4.0297697],[35.9430055,4.0323867],[35.9475455,4.0363707],[35.9513815,4.0380157],[35.9559365,4.0406777],[35.9583165,4.0402267],[35.9642105,4.0405587],[35.9712065,4.0396077],[35.9733275,4.0410627],[35.9767635,4.0405707],[35.9814295,4.0434357],[35.9797198,4.0519722],[35.982246,4.0525682],[35.9857362,4.0525252],[35.9920387,4.0542642],[36.0017177,4.0608962],[36.0067763,4.0704884],[36.0153356,4.0686507],[36.0202413,4.0678643],[36.0293254,4.0697703],[36.0324333,4.0690289],[36.0400302,4.0729088],[36.047292,4.080599],[36.047581,4.087745],[36.047463,4.093549],[36.051247,4.099221],[36.056458,4.103793],[36.060185,4.106148],[36.063222,4.107822],[36.065343,4.112944],[36.075195,4.126781],[36.081726,4.136975],[36.087516,4.138465],[36.095363,4.140865],[36.103556,4.137994],[36.108939,4.139232],[36.11381,4.142853],[36.123725,4.148095],[36.128191,4.155882],[36.130655,4.148124],[36.138044,4.152358],[36.152082,4.152175],[36.163483,4.160517],[36.171105,4.161285],[36.17202,4.151],[36.176091,4.152587],[36.17838,4.163451],[36.185428,4.174514],[36.189838,4.193045],[36.194938,4.212108],[36.205822,4.227716],[36.214019,4.230638],[36.227938,4.24122],[36.23493,4.25833],[36.242491,4.264924],[36.254069,4.270717],[36.250227,4.281805],[36.246619,4.298507],[36.245589,4.314613],[36.247534,4.324268],[36.253554,4.338977],[36.265414,4.347571],[36.272859,4.353524],[36.280649,4.356767],[36.284147,4.370359],[36.288961,4.375979],[36.295034,4.371132],[36.302651,4.373865],[36.305458,4.382133],[36.307457,4.383728],[36.308781,4.377268],[36.317433,4.373933],[36.319325,4.363654],[36.326083,4.36366],[36.3341357,4.3520004],[36.348087,4.351403],[36.355017,4.363849],[36.360976,4.379548],[36.367167,4.384991],[36.3715442,4.3788963],[36.374571,4.3745],[36.382349,4.386584],[36.3912692,4.3874073],[36.406011,4.392898],[36.417355,4.394714],[36.426064,4.391161],[36.438895,4.382842],[36.451156,4.367864],[36.466684,4.364087],[36.468916,4.358077],[36.472986,4.349591],[36.476118,4.341894],[36.478144,4.337014],[36.475222,4.334018],[36.470697,4.333404],[36.467543,4.330522],[36.467772,4.32477],[36.467257,4.319304],[36.465883,4.312164],[36.465941,4.303449],[36.462328,4.298184],[36.4612996,4.2891826],[36.461985,4.277591],[36.460901,4.264833],[36.459292,4.251876],[36.463529,4.239935],[36.4739627,4.2359567],[36.479516,4.230194],[36.479058,4.22675],[36.477284,4.221227],[36.47545,4.216013],[36.473443,4.210782],[36.471612,4.205561],[36.469319,4.200834],[36.46697,4.195849],[36.465112,4.191446],[36.462499,4.185966],[36.459752,4.179698],[36.460492,4.176121],[36.460576,4.170443],[36.462445,4.165367],[36.467027,4.165413],[36.468972,4.161522],[36.469262,4.156286],[36.46943,4.152022],[36.469605,4.148166],[36.469663,4.144527],[36.468862,4.141141],[36.467603,4.138134],[36.465768,4.13112],[36.467655,4.12076],[36.46817,4.116687],[36.466854,4.111994],[36.465019,4.106849],[36.4640411,4.1019925],[36.465538,4.09685],[36.46817,4.091447],[36.468346,4.087264],[36.465832,4.084652],[36.464043,4.08169],[36.464218,4.076796],[36.462097,4.069823],[36.460896,4.06423],[36.461502,4.058087],[36.464046,4.055665],[36.463703,4.053384],[36.463703,4.050519],[36.465191,4.04758],[36.465649,4.044709],[36.465538,4.041861],[36.46307,4.039059],[36.461868,4.035937],[36.460896,4.033358],[36.459919,4.029967],[36.459518,4.027462],[36.459351,4.024484],[36.459351,4.020891],[36.459637,4.017853],[36.458775,4.015853],[36.459747,4.013642],[36.461067,4.011665],[36.461239,4.008995],[36.460949,4.006223],[36.461925,4.003695],[36.461582,4.000372],[36.461582,3.996493],[36.461582,3.992993],[36.460896,3.989668],[36.456539,3.980851],[36.457287,3.977997],[36.457916,3.974594],[36.456768,3.972193],[36.457745,3.968561],[36.45826,3.964407],[36.453102,3.951348],[36.452984,3.942696],[36.45494,3.934411],[36.45671,3.931757],[36.457572,3.92895],[36.458213,3.926097],[36.458774,3.923616],[36.458487,3.921147],[36.457972,3.918763],[36.457457,3.916104],[36.457229,3.912134],[36.45843,3.909663],[36.461158,3.906994],[36.462443,3.905286],[36.463187,3.901997],[36.463935,3.900235],[36.46519,3.898347],[36.465362,3.895786],[36.466624,3.892005],[36.467601,3.88914],[36.468055,3.886269],[36.469256,3.88408],[36.471319,3.875721],[36.467829,3.866289],[36.467081,3.863167],[36.467996,3.859075],[36.46903,3.855253],[36.470518,3.849713],[36.471666,3.847118],[36.473726,3.848475],[36.474642,3.849816],[36.476534,3.848578],[36.47854,3.847788],[36.480772,3.846207],[36.482668,3.845009],[36.485075,3.844081],[36.48662,3.842637],[36.487417,3.840362],[36.488336,3.838408],[36.487535,3.836648],[36.486673,3.833915],[36.486505,3.831829],[36.488278,3.830397],[36.489827,3.828965],[36.49212,3.827309],[36.494008,3.825992],[36.495843,3.82484],[36.497559,3.824083],[36.49965,3.823088],[36.500886,3.822147],[36.502145,3.818927],[36.50266,3.817293],[36.50369,3.813953],[36.508164,3.813432],[36.510114,3.813314],[36.512573,3.810303],[36.513717,3.812933],[36.51561,3.814411],[36.516754,3.814938],[36.51807,3.815184],[36.519352,3.814749],[36.520359,3.81418],[36.522529,3.813408],[36.523392,3.810215],[36.525203,3.808996],[36.527012,3.807083],[36.531658,3.806589],[36.533714,3.804934],[36.53543,3.802339],[36.534462,3.799032],[36.53371,3.795858],[36.5348,3.794924],[36.535891,3.793686],[36.53612,3.791067],[36.53411,3.788751],[36.532238,3.78769],[36.53414,3.778961],[36.532447,3.774039],[36.532279,3.771442],[36.532508,3.769225],[36.535315,3.765324],[36.538012,3.762963],[36.544253,3.759382],[36.552047,3.752157],[36.556627,3.740961],[36.563562,3.730407],[36.574048,3.725215],[36.586087,3.720108],[36.586506,3.667054],[36.586906,3.65413],[36.586937,3.63999],[36.586551,3.615497],[36.588482,3.611249],[36.590664,3.604821],[36.591346,3.599359],[36.591575,3.594913],[36.591751,3.591103],[36.591865,3.586244],[36.592327,3.581219],[36.597193,3.576434],[36.602866,3.562689],[36.600974,3.554152],[36.601775,3.549115],[36.602919,3.544858],[36.603781,3.535696],[36.605166,3.527087],[36.606597,3.520685],[36.608794,3.515822],[36.610377,3.512954],[36.611398,3.505737],[36.612508,3.499471],[36.609453,3.495466],[36.608076,3.491341],[36.604239,3.491771],[36.6007127,3.4912511],[36.595759,3.489892],[36.591445,3.487444],[36.590426,3.484375],[36.588595,3.482494],[36.58734,3.482455],[36.586878,3.473293],[36.581725,3.476696],[36.578684,3.478031],[36.575538,3.475063],[36.576392,3.472606],[36.577658,3.468177],[36.576506,3.46236],[36.5744732,3.4610939],[36.571415,3.461111],[36.569915,3.458333],[36.568588,3.454721],[36.566974,3.45009],[36.566784,3.446007],[36.566532,3.443812],[36.566383,3.440776],[36.566719,3.436893],[36.56631,3.431832],[36.566653,3.421691],[36.561386,3.414918],[36.557014,3.411886],[36.552055,3.410142],[36.5485747,3.4052177],[36.554232,3.3987095],[36.5544671,3.3868067],[36.5532767,3.3825522],[36.5521587,3.3804382],[36.5523337,3.3745582],[36.5554647,3.3683662],[36.5571438,3.3588822],[36.5608098,3.3525562],[36.5613398,3.3500652],[36.5601228,3.3436342],[36.5624769,3.3333442],[36.5620189,3.3245942],[36.5593969,3.3204728],[36.5581261,3.3195853],[36.5575076,3.3173577],[36.5572564,3.3149477],[36.5571623,3.3113002],[36.5544323,3.3086389],[36.5480999,3.3048504],[36.5460584,3.3004871],[36.544138,3.296758],[36.540358,3.297698],[36.536174,3.299532],[36.532306,3.300744],[36.531635,3.304769],[36.527633,3.305771],[36.525516,3.301789],[36.522308,3.295383],[36.517894,3.293504]];

// Algorithme de Ray Casting pour vérifier si un point est dans un polygone
const isPointInPolygon = (point, polygon) => {
  const lat = point[0];
  const lng = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Component pour capturer les clics sur la carte
function MapClickHandler({ isDrawing, onAddPoint }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

const RegionPage = () => {
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [regionToDelete, setRegionToDelete] = useState(null);
  const [editingRegion, setEditingRegion] = useState(null);
  const [mapMode, setMapMode] = useState('satellite');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    commune_id: '',
    color_hex: '#10b981'
  });

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const [regionsRes, communesRes] = await Promise.all([
        regionsService.getAll(),
        communeService.getAll()
      ]);
      
      if (regionsRes.success) {
        const validRegions = regionsRes.data.filter(r => 
          r.geometry && 
          r.geometry.coordinates && 
          r.geometry.coordinates[0]
        );
        
        // Trier pour mettre les régions "hors limites" en haut
        validRegions.sort((a, b) => {
          const aPoints = a.geometry.coordinates[0];
          const bPoints = b.geometry.coordinates[0];
          const aOutside = aPoints.some(p => !isPointInPolygon([p[1], p[0]], BOUIRA_WILAYA_GEOM));
          const bOutside = bPoints.some(p => !isPointInPolygon([p[1], p[0]], BOUIRA_WILAYA_GEOM));
          
          if (aOutside && !bOutside) return -1;
          if (!aOutside && bOutside) return 1;
          return a.name.localeCompare(b.name);
        });

        setRegions(validRegions);
      }
      // Communes fetching might return array directly or {success, data}
      // Adjust based on your backend response structure for /communes
      if(Array.isArray(communesRes)) setCommunes(communesRes);
      else if(communesRes.data) setCommunes(communesRes.data);

    } catch (error) {
      console.error('❌ Error fetch data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleAddPoint = (point) => {
    setPoints(prev => [...prev, point]);
  };

  const closePolygon = () => {
    if (points.length < 3) {
      toast.error('Il faut au minimum 3 points pour créer une zone.');
      return;
    }
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      setPoints(prev => [...prev, first]);
    }
  };

  const handleOpenModal = () => {
    if (editingRegion) {
        setFormData({
            name: editingRegion.name,
            code: editingRegion.code,
            commune_id: editingRegion.commune_id || '',
            color_hex: editingRegion.color_hex || '#10b981'
        });
    } else {
        setFormData({
            name: `Nouvelle Région ${regions.length + 1}`,
            code: `REG-${Math.floor(Math.random() * 9000 + 1000)}`,
            commune_id: '',
            color_hex: '#10b981'
        });
    }
    setShowModal(true);
  };

  const saveRegion = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Veuillez remplir le nom et le code.');
      return;
    }

    let geometry = editingRegion ? editingRegion.geometry : null;
    if (points.length >= 3) {
        const first = points[0];
        const last = points[points.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
            geometry = {
                type: 'Polygon',
                coordinates: [points.map(p => [p[1], p[0]])]
            };
        }
    }

    if (!geometry) {
        toast.error('Veuillez tracer une zone sur la carte.');
        return;
    }

    try {
      setLoading(true);
      let response;
      if (editingRegion) {
        response = await regionsService.update(editingRegion.id, {
            ...formData,
            geometry: points.length >= 3 ? JSON.stringify(geometry) : undefined
        });
      } else {
        response = await regionsService.create({
            ...formData,
            geometry: JSON.stringify(geometry)
        });
      }

      if (response.success) {
        setShowModal(false);
        setPoints([]);
        setIsDrawing(false);
        setEditingRegion(null);
        fetchRegions();
        toast.success(editingRegion ? '✅ Région mise à jour !' : '✅ Région créée !');
      }
    } catch (error) {
      toast.error('Erreur: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (region) => {
    setEditingRegion(region);
    setPoints([]); 
    setIsDrawing(false);
    handleOpenModal();
  };

  const startRedraw = (region) => {
    setEditingRegion(region);
    setPoints([]);
    setIsDrawing(true);
  };

  const confirmDelete = (region) => {
    setRegionToDelete(region);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!regionToDelete) return;
    try {
      setLoading(true);
      await regionsService.delete(regionToDelete.id);
      setShowDeleteModal(false);
      setRegionToDelete(null);
      fetchRegions();
      toast.success('✅ Région supprimée avec succès !');
    } catch (error) {
      toast.error('Erreur: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const isClosed = points.length > 2 && 
    points[0][0] === points[points.length - 1][0] && 
    points[0][1] === points[points.length - 1][1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: 'var(--bg-primary)', padding: '20px', position: 'relative' }}>
      

      {/* Header & Controls Overlay */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 24px',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <MapIcon size={24} color="var(--green-primary)" /> Gestion des Régions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Définissez les zones d'intervention pour la collecte des déchets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {!isDrawing ? (
            <button 
              onClick={() => { setEditingRegion(null); setPoints([]); setIsDrawing(true); }}
              style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--green-primary)', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Plus size={18} /> Nouvelle Zone
            </button>
          ) : (
            <>
              <button 
                onClick={closePolygon} 
                disabled={isClosed || points.length < 3}
                style={{ padding: '10px 20px', borderRadius: '8px', background: isClosed ? 'var(--gray-300)' : '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold', cursor: points.length < 3 || isClosed ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Lock size={18} /> Fermer
              </button>
              <button 
                onClick={handleOpenModal}
                disabled={!isClosed}
                style={{ padding: '10px 20px', borderRadius: '8px', background: !isClosed ? '#b2b2b2' : '#21831eff', color: 'white', border: 'none', fontWeight: 'bold', cursor: !isClosed ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={18} /> {editingRegion ? 'Mettre à jour' : 'Enregistrer'}
              </button>
              <button 
                onClick={() => { setPoints([]); setIsDrawing(false); setEditingRegion(null); }}
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <X size={18} /> Annuler
              </button>
            </>
          )}
          <button 
            onClick={fetchRegions}
            style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: '320px', background: 'var(--bg-secondary)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Layers size={18} color="var(--green-primary)" /> Zones ({regions.length})
            </h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {regions.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                Aucune zone définie.
              </div>
            ) : (
              regions.map(r => (
                <div key={r.id} style={{ 
                  padding: '12px', 
                  borderRadius: '10px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  marginBottom: '10px',
                  position: 'relative',
                  borderLeft: `4px solid ${r.color_hex || '#10b981'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{r.name}</div>
                    {r.geometry.coordinates[0].some(p => !isPointInPolygon([p[1], p[0]], BOUIRA_WILAYA_GEOM)) && (
                      <AlertCircle size={16} color="#ef4444" title="Hors limites (Wilaya de Bouira)" />
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Code: {r.code}</div>
                  {r.commune_id && (
                     <div style={{ fontSize: '11px', color: 'var(--green-primary)', marginTop: '2px' }}>
                        Commune ID: {r.commune_id} 
                        {/* If we had commune map, we could show name: {communes.find(c => c.id === r.commune_id)?.name} */}
                     </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => startEditing(r)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--green-primary)', cursor: 'pointer', padding: '4px' }}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                        onClick={() => confirmDelete(r)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Supprimer"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', border: '1px solid var(--border-color)' }}>
          <MapContainer 
            center={CENTER_BOUIRA} 
            zoom={10} 
            minZoom={9}
            maxBounds={BOUIRA_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            {mapMode === 'satellite' ? (
              <TileLayer 
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='© Esri'
                maxZoom={19}
              />
            ) : (
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap'
                maxZoom={19}
              />
            )}
            
            {/* Super Région : Limites de la Wilaya (Transparente et Inchangeable) */}
            <Polygon 
              positions={BOUIRA_WILAYA_GEOM}
              interactive={false}
              pathOptions={{
                color: mapMode === 'satellite' ? '#ffffff' : '#64748b', // Blanc sur satellite, gris-bleu sur plan
                fillColor: 'transparent',
                fillOpacity: 0,
                weight: 3,
                dashArray: '10, 10',
                opacity: 0.7
              }}
            />
            
            <MapClickHandler isDrawing={isDrawing} onAddPoint={handleAddPoint} />
            
            {/* Existing Regions */}
            {regions.map(region => (
              <React.Fragment key={region.id}>
                <Polygon 
                  positions={region.geometry.coordinates[0].map(c => [c[1], c[0]])}
                  interactive={!isDrawing}
                  pathOptions={{
                    color: region.color_hex || '#10b981',
                    fillColor: region.color_hex || '#10b981',
                    fillOpacity: 0.3,
                    weight: editingRegion?.id === region.id ? 4 : 2,
                    dashArray: editingRegion?.id === region.id ? '5, 5' : '0'
                  }}
                >
                  {!isDrawing && (
                    <Popup>
                      <div style={{ minWidth: '180px', color: 'var(--text-primary)', padding: '4px' }}>
                        <h3 style={{ 
                          margin: '0 0 12px 0', 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          borderBottom: '1px solid var(--border-color)', 
                          paddingBottom: '8px',
                          color: 'var(--text-primary)'
                        }}>
                          {region.name}
                        </h3>
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ margin: '4px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Code:</span>
                            <span style={{ fontWeight: '600' }}>{region.code}</span>
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                              onClick={() => startEditing(region)}
                              style={{ 
                                flex: 1, 
                                padding: '8px', 
                                background: 'var(--green-primary)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                          >
                              Modifier
                          </button>
                          <button 
                              onClick={() => confirmDelete(region)}
                              style={{ 
                                flex: 1, 
                                padding: '8px', 
                                background: '#ef4444', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                          >
                              Supprimer
                          </button>
                        </div>
                      </div>
                    </Popup>
                  )}
                </Polygon>
              </React.Fragment>
            ))}
            
            {/* Active Drawing */}
            {points.length > 0 && (
              <>
                {points.map((p, i) => (
                  <Marker 
                    key={i} 
                    position={p} 
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="background: #ef4444; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`
                    })}
                  />
                ))}
                {points.length > 1 && (
                  <Polyline 
                    positions={points} 
                    pathOptions={{ color: '#ef4444', weight: 4, dashArray: '10, 5' }} 
                  />
                )}
              </>
            )}
          </MapContainer>

          {/* Map Controls Floating Overlay */}
          <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 500, background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', fontSize: '12px', maxWidth: '200px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}><Info size={14} color="var(--green-primary)" /> {isDrawing ? 'Tracé en cours' : 'Aide'}</h4>
            <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text-secondary)' }}>
              {isDrawing ? (
                  <>
                    <li>Cliquez pour ajouter des points.</li>
                    <li>"Fermer" pour lier au 1er point.</li>
                    <li>"Enregistrer" pour finaliser.</li>
                  </>
              ) : (
                  <>
                    <li>Sélectionnez une zone pour voir les détails.</li>
                    <li>Utilisez les boutons d'action pour modifier.</li>
                  </>
              )}
            </ul>
          </div>
          
          {/* Layer Toggle Button */}
          <button 
            onClick={() => setMapMode(prev => prev === 'satellite' ? 'streets' : 'satellite')}
            style={{ 
              position: 'absolute', 
              top: '24px', 
              right: '24px', 
              zIndex: 500, 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)', 
              padding: '12px', 
              borderRadius: '12px', 
              boxShadow: 'var(--shadow-md)', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px'
            }}
          >
            <Layers size={18} color="var(--green-primary)" />
            {mapMode === 'satellite' ? 'Vue Plan' : 'Vue Satellite'}
          </button>
          
          {editingRegion && (
              <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#f59e0b', color: 'white', padding: '8px 20px', borderRadius: '20px', boxShadow: 'var(--shadow-md)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={16} /> Mode Edition : {editingRegion.name}
              </div>
          )}
        </div>
      </div>

      {/* Styled Modal (Creation / Edit) - Wrapped in Portal for correct overlay */}
      {showModal && createPortal(
        <div 
          onKeyDown={stopPropagation}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}
        >
          <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '16px', width: '420px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              {editingRegion ? <Edit2 color="var(--green-primary)" /> : <Save color="var(--green-primary)" />} 
              {editingRegion ? 'Modifier la Zone' : 'Paramètres de la Zone'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Nom de la zone</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={stopPropagation}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                placeholder="Ex: Centre Ville"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Code Identifiant</label>
              <input 
                type="text" 
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                onKeyDown={stopPropagation}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Commune Rattachée</label>
              <select
                value={formData.commune_id}
                onChange={(e) => setFormData(prev => ({ ...prev, commune_id: e.target.value }))}
                onKeyDown={stopPropagation}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="">Sélectionner une commune</option>
                {communes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Couleur de la Zone</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="color" 
                    value={formData.color_hex}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                    onKeyDown={stopPropagation}
                    style={{ border: 'none', width: '48px', height: '48px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{formData.color_hex}</span>
                </div>
            </div>

            {editingRegion && (
              <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed #f59e0b' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#f59e0b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapIcon size={16} /> Géométrie de la zone
                </p>
                <button 
                  type="button"
                  onClick={() => { setShowModal(false); setIsDrawing(true); setPoints([]); }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <RefreshCw size={14} /> Redessiner les contours
                </button>
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={14} /> 
                {points.length >= 3 ? 'Nouvelle géométrie détectée.' : editingRegion ? 'Géométrie actuelle conservée.' : ''}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                onClick={() => { setShowModal(false); setEditingRegion(null); }}
                style={{ padding: '12px 24px', borderRadius: '12px', background: '#ffffff', color: '#475569', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Annuler
              </button>
              <button 
                onClick={saveRegion}
                disabled={loading}
                style={{ padding: '12px 28px', borderRadius: '12px', background: '#21831eff', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {loading ? 'Traitement...' : editingRegion ? 'Mettre à jour' : 'Créer la zone'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Styled Delete Confirmation Modal - Refactored to use standard portal-enabled component */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setRegionToDelete(null); }}
        onConfirm={handleDelete}
        title="Supprimer la région ?"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer la zone <strong>{regionToDelete?.name}</strong> ? Cette action est irréversible.
          </>
        }
        confirmText={loading ? 'Suppression...' : 'Oui, supprimer'}
        cancelText="Annuler"
        variant="danger"
        icon={Trash2}
      />

      {/* Global CSS adjustments */}
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .leaflet-container {
          cursor: ${isDrawing ? 'crosshair' : 'grab'};
          border-radius: 12px;
        }
        .custom-marker {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default RegionPage;
