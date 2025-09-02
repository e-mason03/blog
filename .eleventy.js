module.exports = function(eleventyConfig) {
  // Copy CSS files
  eleventyConfig.addPassthroughCopy("src/css");
  
  // Copy images
  eleventyConfig.addPassthroughCopy("src/images");
  
  // Date filter for posts
  eleventyConfig.addFilter("dateDisplay", function(dateObj) {
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};