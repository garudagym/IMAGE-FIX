const { Setting, Product, Plan, Gallery, Coupon } = require('./models');

const plans = [
  {name:'Strength — 1 Month',price:999,period:'30 days',tag:'Strength',features:['Strength training access','Attendance calendar','Progress dashboard']},
  {name:'Strength — 3 Months',price:2499,period:'90 days',tag:'Strength',features:['Strength training access','Attendance calendar','Progress tracking']},
  {name:'Strength — 6 Months',price:4499,period:'180 days',tag:'Strength',features:['Strength training access','Progress reviews','Member support']},
  {name:'Strength — 1 Year',price:7999,period:'365 days',tag:'Strength',features:['Strength training access','Annual progress review','Member support']},
  {name:'Cardio — 1 Month',price:899,period:'30 days',tag:'Cardio',features:['Cardio training access','Attendance calendar','Progress dashboard']},
  {name:'Cardio — 3 Months',price:2199,period:'90 days',tag:'Cardio',features:['Cardio training access','Attendance calendar','Progress tracking']},
  {name:'Cardio — 6 Months',price:3999,period:'180 days',tag:'Cardio',features:['Cardio training access','Progress reviews','Member support']},
  {name:'Cardio — 1 Year',price:6499,period:'365 days',tag:'Cardio',features:['Cardio training access','Annual progress review','Member support']},
  {name:'Strength + Cardio — 1 Month',price:1499,period:'30 days',tag:'Combo',features:['Strength + cardio access','Attendance calendar','Progress dashboard']},
  {name:'Strength + Cardio — 3 Months',price:3999,period:'90 days',tag:'Combo',features:['Strength + cardio access','Trainer assessment','Priority support']},
  {name:'Strength + Cardio — 6 Months',price:6999,period:'180 days',tag:'Combo',features:['Strength + cardio access','Progress reviews','Member support']},
  {name:'Strength + Cardio — 1 Year',price:11999,period:'365 days',tag:'Combo',features:['Strength + cardio access','Annual assessment','Goal planning']},
  {name:'Personal Trainer',price:0,period:'Enquiry',tag:'Coaching',features:['Personalized workout plan','Diet & nutrition guidance','One-to-one attention','Faster & better results'],enquiryOnly:true}
];

const products = [
 {id:'p1',name:'Whey Protein',price:2499,category:'Protein',img:'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=700&q=80'},
 {id:'p2',name:'Creatine Monohydrate',price:1299,category:'Creatine',img:'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=700&q=80'},
 {id:'p3',name:'Mass Gainer',price:2299,category:'Mass Gainer',img:'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=700&q=80'},
 {id:'p4',name:'Fish Oil',price:799,category:'Supplements',img:'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=700&q=80'},
 {id:'p5',name:'BCAA',price:999,category:'Pre-workouts',img:'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=700&q=80'},
 {id:'p6',name:'Peanut Butter',price:499,category:'Grocery',img:'https://images.unsplash.com/photo-1563599175592-c58dc214deff?auto=format&fit=crop&w=700&q=80'}
];

const gallery = [
 ['Machine Zone','A dedicated strength floor with premium resistance equipment.','/gallery/machine-zone.jpg',1],
 ['Cardio Zone','A complete cardio area for conditioning and endurance.','/gallery/cardio-zone.jpg',2],
 ['Treadmill Zone','Dedicated treadmills for steady-state cardio and conditioning.','/gallery/treadmill.jpg',3],
 ['Strength Floor','Free-weight and bench training space built for progressive strength.','/gallery/strength-floor.jpg',4],
 ['Cable & Functional','Versatile cable and functional equipment for full-body training.','/gallery/cable-functional.jpg',5],
 ['Boxing Zone','A focused training corner for boxing, conditioning and movement.','/gallery/boxing-zone.jpg',6],
 ['Full Gym Floor','A wide view of the complete Garuda Fitness Zone training floor.','/gallery/full-gym-floor.jpg',7]
];

async function ensureCatalog() {
  const marker = await Setting.findOne({key:'catalogSeedVersion'}).lean();
  if (marker?.value === 1) return;

  if (await Plan.countDocuments() === 0) await Plan.insertMany(plans);
  if (await Product.countDocuments() === 0) await Product.insertMany(products);
  if (await Gallery.countDocuments() === 0) {
    await Gallery.insertMany(gallery.map(([name,description,imageUrl,sortOrder]) => ({name,description,imageUrl,sortOrder,active:true})));
  }
  if (!await Coupon.exists({code:'WELCOME10'})) {
    await Coupon.create({code:'WELCOME10',type:'percent',value:10,minOrder:500,active:true});
  }
  if (!await Setting.exists({key:'site'})) {
    await Setting.create({key:'site',value:{name:'Garuda Fitness Zone',currency:'INR',phone:'+917989232047',location:'Manjurnagar'}});
  }

  await Setting.findOneAndUpdate({key:'catalogSeedVersion'},{key:'catalogSeedVersion',value:1},{upsert:true});
  console.log('Catalog initialized: plans, products and gallery are available.');
}

module.exports = { ensureCatalog };
