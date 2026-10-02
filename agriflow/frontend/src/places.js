const STATES = [
  ['Andhra Pradesh', 'आंध्र प्रदेश', 'આંધ્ર પ્રદેશ'],
  ['Arunachal Pradesh', 'अरुणाचल प्रदेश', 'અરુણાચલ પ્રદેશ'],
  ['Assam', 'असम', 'આસામ'],
  ['Bihar', 'बिहार', 'બિહાર'],
  ['Chhattisgarh', 'छत्तीसगढ़', 'છત્તીસગઢ'],
  ['Goa', 'गोवा', 'ગોવા'],
  ['Gujarat', 'गुजरात', 'ગુજરાત'],
  ['Haryana', 'हरियाणा', 'હરિયાણા'],
  ['Himachal Pradesh', 'हिमाचल प्रदेश', 'હિમાચલ પ્રદેશ'],
  ['Jharkhand', 'झारखंड', 'ઝારખંડ'],
  ['Karnataka', 'कर्नाटक', 'કર્ણાટક'],
  ['Kerala', 'केरल', 'કેરળ'],
  ['Madhya Pradesh', 'मध्य प्रदेश', 'મધ્ય પ્રદેશ'],
  ['Maharashtra', 'महाराष्ट्र', 'મહારાષ્ટ્ર'],
  ['Manipur', 'मणिपुर', 'મણિપુર'],
  ['Meghalaya', 'मेघालय', 'મેઘાલય'],
  ['Mizoram', 'मिजोरम', 'મિઝોરમ'],
  ['Nagaland', 'नागालैंड', 'નાગાલેન્ડ'],
  ['Odisha', 'ओडिशा', 'ઓડિશા'],
  ['Punjab', 'पंजाब', 'પંજાબ'],
  ['Rajasthan', 'राजस्थान', 'રાજસ્થાન'],
  ['Sikkim', 'सिक्किम', 'સિક્કિમ'],
  ['Tamil Nadu', 'तमिलनाडु', 'તમિલનાડુ'],
  ['Telangana', 'तेलंगाना', 'તેલંગાણા'],
  ['Tripura', 'त्रिपुरा', 'ત્રિપુરા'],
  ['Uttar Pradesh', 'उत्तर प्रदेश', 'ઉત્તર પ્રદેશ'],
  ['Uttarakhand', 'उत्तराखंड', 'ઉત્તરાખંડ'],
  ['West Bengal', 'पश्चिम बंगाल', 'પશ્ચિમ બંગાળ'],
  ['Andaman and Nicobar Islands', 'अंडमान और निकोबार', 'આંદામાન અને નિકોબાર'],
  ['Chandigarh', 'चंडीगढ़', 'ચંડીગઢ'],
  ['Dadra and Nagar Haveli and Daman and Diu', 'दादरा और नगर हवेली और दमन और दीव', 'દાદરા અને નગર હવેલી અને દમણ અને દીવ'],
  ['Delhi', 'दिल्ली', 'દિલ્હી'],
  ['Jammu and Kashmir', 'जम्मू और कश्मीर', 'જમ્મુ અને કાશ્મીર'],
  ['Ladakh', 'लद्दाख', 'લદ્દાખ'],
  ['Lakshadweep', 'लक्षद्वीप', 'લક્ષદ્વીપ'],
  ['Puducherry', 'पुदुचेरी', 'પુદુચેરી'],
];

const GUJARAT = [
  ['Ahmedabad', 'अहमदाबाद', 'અમદાવાદ'],
  ['Amreli', 'अमरेली', 'અમરેલી'],
  ['Anand', 'आणंद', 'આણંદ'],
  ['Aravalli', 'अरावली', 'અરવલ્લી'],
  ['Banaskantha', 'बनासकांठा', 'બનાસકાંઠા'],
  ['Bharuch', 'भरूच', 'ભરૂચ'],
  ['Bhavnagar', 'भावनगर', 'ભાવનગર'],
  ['Botad', 'बोटाद', 'બોટાદ'],
  ['Chhota Udaipur', 'छोटा उदयपुर', 'છોટા ઉદેપુર'],
  ['Dahod', 'दाहोद', 'દાહોદ'],
  ['Dang', 'डांग', 'ડાંગ'],
  ['Devbhumi Dwarka', 'देवभूमि द्वारका', 'દેવભૂમિ દ્વારકા'],
  ['Gandhinagar', 'गांधीनगर', 'ગાંધીનગર'],
  ['Gir Somnath', 'गिर सोमनाथ', 'ગીર સોમનાથ'],
  ['Jamnagar', 'जामनगर', 'જામનગર'],
  ['Junagadh', 'जूनागढ़', 'જૂનાગઢ'],
  ['Kheda', 'खेड़ा', 'ખેડા'],
  ['Kutch', 'कच्छ', 'કચ્છ'],
  ['Mahisagar', 'महीसागर', 'મહીસાગર'],
  ['Mehsana', 'मेहसाणा', 'મહેસાણા'],
  ['Morbi', 'मोरबी', 'મોરબી'],
  ['Narmada', 'नर्मदा', 'નર્મદા'],
  ['Navsari', 'नवसारी', 'નવસારી'],
  ['Panchmahal', 'पंचमहल', 'પંચમહાલ'],
  ['Patan', 'पाटन', 'પાટણ'],
  ['Porbandar', 'पोरबंदर', 'પોરબંદર'],
  ['Rajkot', 'राजकोट', 'રાજકોટ'],
  ['Sabarkantha', 'साबरकांठा', 'સાબરકાંઠા'],
  ['Surat', 'सूरत', 'સુરત'],
  ['Surendranagar', 'सुरेंद्रनगर', 'સુરેન્દ્રનગર'],
  ['Tapi', 'तापी', 'તાપી'],
  ['Vadodara', 'वडोदरा', 'વડોદરા'],
  ['Valsad', 'वलसाड', 'વલસાડ'],
];

const EXTRA = {
  Maharashtra: ['Pune', 'Nashik', 'Nagpur', 'Ahmednagar', 'Kolhapur', 'Satara', 'Jalgaon'],
  Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Ujjain', 'Gwalior', 'Sagar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Prayagraj'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  Haryana: ['Karnal', 'Hisar', 'Rohtak', 'Ambala', 'Panipat'],
  Bihar: ['Patna', 'Muzaffarpur', 'Bhagalpur', 'Gaya', 'Nalanda'],
};

const VILLAGES = [
  ['Anand', 'आणंद', 'આણંદ'],
  ['Gamdi', 'गामडी', 'ગામડી'],
  ['Lambhvel', 'लांभवेल', 'લાંભવેલ'],
  ['Borsad', 'बोरसद', 'બોરસદ'],
  ['Petlad', 'पेटलाद', 'પેટલાદ'],
  ['Nadiad', 'नडियाद', 'નડિયાદ'],
  ['Vadodara', 'वडोदरा', 'વડોદરા'],
  ['Karamsad', 'करमसाद', 'કરમસદ'],
  ['Vallabh Vidyanagar', 'वल्लभ विद्यानगर', 'વલ્લભ વિદ્યાનગર'],
  ['Khambhat', 'खंभात', 'ખંભાત'],
  ['Umreth', 'उमरेठ', 'ઉમરેઠ'],
  ['Sojitra', 'सोजित्रा', 'સોજિત્રા'],
  ['Tarapur', 'तारापुर', 'તારાપુર'],
  ['Mahudha', 'महुधा', 'મહુધા'],
  ['Thasra', 'ठासरा', 'ઠાસરા'],
];

function label(row, lang) {
  if (lang === 'hi') return row[1];
  if (lang === 'gu') return row[2];
  return row[0];
}

export function stateOptions() {
  return STATES.map((row) => row[0]);
}

export function stateLabel(lang, value) {
  const row = STATES.find((item) => item[0] === value);
  return row ? label(row, lang) : value;
}

export function districtOptions(state) {
  if (state === 'Gujarat') return GUJARAT.map((row) => row[0]);
  return EXTRA[state] || [];
}

export function districtLabel(lang, value) {
  const row = GUJARAT.find((item) => item[0] === value);
  return row ? label(row, lang) : value;
}

export function villageOptions() {
  return VILLAGES.map((row) => row[0]);
}

export function villageLabel(lang, value) {
  const row = VILLAGES.find((item) => item[0] === value);
  return row ? label(row, lang) : value;
}
