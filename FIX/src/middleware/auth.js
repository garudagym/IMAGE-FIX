const jwt = require('jsonwebtoken');
function sign(user){ return jwt.sign({ sub:user.id, role:user.role, memberCode:user.memberCode, username:user.username }, process.env.JWT_SECRET, { expiresIn:'7d' }); }
function requireAuth(req,res,next){ try { const h=req.get('authorization')||''; const token=h.startsWith('Bearer ')?h.slice(7):null; if(!token) return res.status(401).json({error:'Authentication required'}); req.user=jwt.verify(token,process.env.JWT_SECRET); next(); } catch(e){ return res.status(401).json({error:'Invalid or expired session'}); } }
function requireRole(...roles){ return (req,res,next)=> roles.includes(req.user?.role)?next():res.status(403).json({error:'Insufficient permissions'}); }
module.exports={sign,requireAuth,requireRole};
