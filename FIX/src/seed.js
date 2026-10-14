require('dotenv').config();
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const {Member,Admin,Product,Plan,Gallery,Coupon,Setting}=require('./models');

const plans=[
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
const products=[
 {id:'p1',name:'Whey Protein',price:2499,category:'Protein',img:'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=700&q=80'},
 {id:'p2',name:'Creatine Monohydrate',price:1299,category:'Creatine',img:'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=700&q=80'},
 {id:'p3',name:'Mass Gainer',price:2299,category:'Mass Gainer',img:'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=700&q=80'},
 {id:'p4',name:'Fish Oil',price:799,category:'Supplements',img:'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=700&q=80'},
 {id:'p5',name:'BCAA',price:999,category:'Pre-workouts',img:'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=700&q=80'},
 {id:'p6',name:'Peanut Butter',price:499,category:'Grocery',img:'https://images.unsplash.com/photo-1563599175592-c58dc214deff?auto=format&fit=crop&w=700&q=80'}
];
const gallery=[
 ['Machine Zone','A dedicated strength floor with premium resistance equipment.','/gallery/machine-zone.jpg',1],
 ['Cardio Zone','A complete cardio area for conditioning and endurance.','/gallery/cardio-zone.jpg',2],
 ['Treadmill Zone','Dedicated treadmills for steady-state cardio and conditioning.','/gallery/treadmill.jpg',3],
 ['Strength Floor','Free-weight and bench training space built for progressive strength.','/gallery/strength-floor.jpg',4],
 ['Cable & Functional','Versatile cable and functional equipment for full-body training.','/gallery/cable-functional.jpg',5],
 ['Boxing Zone','A focused training corner for boxing, conditioning and movement.','/gallery/boxing-zone.jpg',6],
 ['Full Gym Floor','A wide view of the complete Garuda Fitness Zone training floor.','/gallery/full-gym-floor.jpg',7]
];
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const adminUser=process.env.ADMIN_USERNAME,adminPin=process.env.ADMIN_PIN;if(!adminUser||!adminPin)throw new Error('ADMIN_USERNAME and ADMIN_PIN are required for seeding');
 await Admin.findOneAndUpdate({username:adminUser},{username:adminUser,pinHash:await bcrypt.hash(adminPin,12),name:'Garuda Admin',role:'admin'},{upsert:true});
 await Plan.deleteMany({}); await Plan.insertMany(plans);
 await Product.deleteMany({}); await Product.insertMany(products);
 await Gallery.deleteMany({}); await Gallery.insertMany(gallery.map(([name,description,imageUrl,sortOrder])=>({name,description,imageUrl,sortOrder})));
 await Member.deleteMany({$or:[{name:/^Arjun Rao$/i},{memberCode:'ARJUN-RAO'}]});
 await Member.findOneAndUpdate({memberCode:'GFZ-1001'},{memberCode:'GFZ-1001',name:'Garuda Gym',pinHash:await bcrypt.hash(String(process.env.DEMO_MEMBER_PIN||'9999'),12),age:26,gender:'Male',joiningWeight:74,currentWeight:70.5,height:178,bodyType:'Athletic',joiningDate:'2026-06-01',feeDueDate:'2026-10-01',monthlyFee:1499,photo:''},{upsert:true,new:true,setDefaultsOnInsert:true});
 await Coupon.findOneAndUpdate({code:'WELCOME10'},{code:'WELCOME10',type:'percent',value:10,minOrder:500,active:true},{upsert:true,new:true});
 await Setting.findOneAndUpdate({key:'site'},{key:'site',value:{name:'Garuda Fitness Zone',currency:'INR',phone:'+917989232047',location:'Manjurnagar'}},{upsert:true});
 console.log('Seed complete. Admin:',adminUser,'Member: GFZ-1001 /',process.env.DEMO_MEMBER_PIN?'configured':'9999');
 await mongoose.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
