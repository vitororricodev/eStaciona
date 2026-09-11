import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stayTotals } from '@/lib/stayTotals';

export async function POST(req: NextRequest){
  const body=await req.json().catch(()=>({}));
  const plate=String(body.plate||'').replace(/[^A-Z0-9]/gi,'').toUpperCase();
  const phoneDigits=String(body.phoneDigits||'').replace(/\D/g,'');
  if(plate.length<6||phoneDigits.length<4) return NextResponse.json({error:'Informe a placa e os 4 últimos dígitos do telefone.'},{status:400});
  const supabase=createAdminClient();
  const {data,error}=await supabase.from('stays').select('public_token,started_at,ended_at,status,final_amount,paid_at,payment_grace_until,vehicles!inner(plate,make,model,color,customers!inner(name,phone)),tariff_plans(*),stay_services(service_name,unit_price,quantity)').eq('status','open').eq('vehicles.plate',plate).limit(20);
  if(error) return NextResponse.json({error:'Não foi possível consultar.'},{status:500});
  const match=(data||[]).find((s:any)=>{
    const c=Array.isArray(s.vehicles?.customers)?s.vehicles.customers[0]:s.vehicles?.customers;
    return String(c?.phone||'').replace(/\D/g,'').endsWith(phoneDigits);
  });
  if(!match) return NextResponse.json({found:false});
  const totals=stayTotals(match);
  return NextResponse.json({found:true,token:match.public_token,summary:{plate,started_at:match.started_at,totalMinutes:totals.totalMinutes,amount:totals.amount}});
}
