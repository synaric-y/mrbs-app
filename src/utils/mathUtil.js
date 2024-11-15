const isBetween = (val,beg,end)=>{
	return val>=beg && val<=end
}

const clamp = (val,beg,end)=>{
	if(val<beg) return beg
	if(val>end) return end
	return val
}

export {
	isBetween,
	clamp
}