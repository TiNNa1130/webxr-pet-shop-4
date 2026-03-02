import{x as s}from"./index-BFo1ria2.js";async function i(t={}){const{category:e=null,limit:r=20,offset:c=0}=t;try{let o=s.from("products").select(`
        id,
        name,
        description,
        category,
        subcategory,
        price,
        original_price,
        cover_image_url,
        has_3d_model,
        has_ar,
        has_try_on,
        avg_rating,
        review_count,
        sold_count
      `).eq("is_active",!0).order("created_at",{ascending:!1}).range(c,c+r-1);e&&(o=o.eq("category",e));const{data:n,error:a}=await o;if(a)throw console.error("获取商品列表失败:",a.message),a;return console.log(`✅ 成功获取 ${n.length} 个商品`),n}catch(o){return console.error("getProducts 异常:",o),[]}}async function u(t){try{const{data:e,error:r}=await s.from("products").select(`
        *,
        product_skus (*),
        product_models (*)
      `).eq("id",t).single();if(r)throw console.error("获取商品详情失败:",r.message),r;return console.log("✅ 成功获取商品详情:",e.name),e}catch(e){return console.error("getProductById 异常:",e),null}}async function g(){return[{value:"clothing",label:"宠物服饰",icon:"👔"},{value:"furniture",label:"宠物家居",icon:"🏠"},{value:"accessory",label:"配饰",icon:"🎀"},{value:"toy",label:"玩具",icon:"🎾"},{value:"food",label:"食品",icon:"🦴"},{value:"other",label:"其他",icon:"📦"}]}export{g as a,u as b,i as g};
