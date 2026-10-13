function notFound(req,res){res.status(404).json({error:'Route not found'});}
function errorHandler(err,req,res,next){
  console.error(err);
  if(res.headersSent)return next(err);
  // Give admins actionable upload errors without leaking stack traces or secrets.
  if(err && (err.name==='MulterError' || err.code==='LIMIT_FILE_SIZE')){
    const messages={
      LIMIT_FILE_SIZE:'Image is too large. Each image must be 10 MB or smaller.',
      LIMIT_FILE_COUNT:'Too many images. Upload no more than 8 at once.',
      LIMIT_UNEXPECTED_FILE:'Unexpected upload field. Please select images using the website upload control.'
    };
    return res.status(400).json({error:messages[err.code]||err.message||'Image upload failed.'});
  }
  if(err && /Only image uploads are allowed/i.test(err.message||''))
    return res.status(400).json({error:'Unsupported file type. Use JPG, PNG, WEBP, GIF, or AVIF.'});
  const status=Number(err.status)||500;
  const safeMessage=process.env.NODE_ENV==='production'?'Server error':(err.message||'Server error');
  res.status(status).json({error:safeMessage});
}
module.exports={notFound,errorHandler};
