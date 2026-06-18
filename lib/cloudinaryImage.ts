export function proImage(url: string) {
    if (!url || !url.includes("res.cloudinary.com")) return url;
  
    return url.replace(
      "/upload/",
      "/upload/f_auto,q_auto,e_auto_contrast,e_auto_brightness,e_sharpen,c_fill,w_900,h_700,g_auto/"
    );
  }
  
  export function proThumb(url: string) {
    if (!url || !url.includes("res.cloudinary.com")) return url;
  
    return url.replace(
      "/upload/",
      "/upload/f_auto,q_auto,e_auto_contrast,e_auto_brightness,e_sharpen,c_fill,w_400,h_300,g_auto/"
    );
  }
  
  export function watermarkImage(url: string) {
    if (!url || !url.includes("res.cloudinary.com")) return url;
  
    return url.replace(
      "/upload/",
      "/upload/f_auto,q_auto,e_auto_contrast,e_auto_brightness,e_sharpen,l_text:Arial_32_bold:Drive%20Prime%20Motors,co_white,g_south_east,x_30,y_30/"
    );
  }