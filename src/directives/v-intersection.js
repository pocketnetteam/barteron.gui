export default {
    inserted: function(el, binding) {
        const callback = (entries, observer) => {
            if(entries[0].isIntersecting) {
                binding.value()
            }
        };
        const options = {
            rootMargin: "0px",
            threshold: 0.1,
        };
        const observer = new IntersectionObserver(callback, options);
        observer.observe(el)
    },
}