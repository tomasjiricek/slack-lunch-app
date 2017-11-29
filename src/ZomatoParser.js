class ZomatoParser {
    parse(data) {
        let restaurants = [];

        if (data instanceof Array) {
            let restaurantsObj = data.map((obj) => {
                let menus = obj.daily_menus;
                let restaurant = { name: obj.restaurantName };

                if (obj.daily_menus instanceof Array && obj.daily_menus.length === 1) {
                    let menuObj = obj.daily_menus[0];
                    if (menuObj instanceof Object && menuObj.daily_menu instanceof Object) {
                        let dishes = menuObj.daily_menu.dishes;
                        if (dishes instanceof Array) {
                            restaurant.dishes = this._parseDishes(dishes);
                        }
                    }
                }

                restaurants.push(restaurant);
            });

        }

        return restaurants;
    }

    _parseDishes(dishes) {
        return dishes.map((obj) => {
            let dishName = (obj.dish.name).replace(/ {2,}/g, ' ').trim();
            return `>•  ${dishName}`;
        });
    }
}

module.exports = ZomatoParser;