
var sc_raq_app_global = {};
sc_raq_app_global.mark_unmark_all_btns_by_added_list = function(v){};
sc_raq_app_global.get_added_item_list = function(v){};
sc_raq_app_global.unmark_raq_btn_as_added = function(v){};
sc_raq_app_global.allow_variant = 1;


(function(){
	var request_mode		= 'product';
	//var MSG_TYPE_NOTICE	= 'notice';
	//var MSG_TYPE_ERROR	= 'error';

	var app_options = {};
	app_options.JQueryVersion	= '1.11.2';
	app_options.AppBaseURL		= '/apps/request-a-quote/';
	app_options.AppScriptPath	= app_options.AppBaseURL+'scripts/';
	app_options.AppFrontPath	= app_options.AppBaseURL+'app-front/';
	app_options.other_scripts = [];
	app_options.other_scripts.push('//code.jquery.com/jquery-migrate-1.2.1.min.js');
	app_options.other_scripts.push(app_options.AppScriptPath+'js/jquery.cookie.js');

	sc_qs_script_loader(app_options, app_process);


	function is_sc_debug() {
		return ($('#sc_debug').length && ($('#sc_debug').text() == '515'));
	}


	function app_process(scjQuery, app_options) {
		scjQuery('.sc-raq-add-to-quote-btn').hide();

		var raq_cart = {};

		if ((typeof scr_cart !== 'undefined') && (typeof scr_cart !== undefined)) raq_cart = scr_cart;
		else {
			scjQuery.ajax({
				type			: 'GET',
				url				: '/cart',
				dataType	: 'JSON',
				async			: false,
				success		: function(data, textStatus, jqXHR){
					raq_cart = data;
				}
			});
		}

		var raq_sess_key = getRaqSessCookieKey();
		//clear_added_item_list();

		scjQuery.ajax({
			type			: 'GET',
			url				: app_options.AppFrontPath + 'app_main/raq-btn-css',
			dataType	: 'json',
			success		: function(data){
				scjQuery('body').append(data.style);

				if (typeof data.allow_variant !== 'undefined') sc_raq_app_global.allow_variant = data.allow_variant;
				if (typeof data.request_mode !== 'undefined') request_mode = data.request_mode;

				scjQuery('.sc-raq-add-to-quote-btn').show();

				app_bind(data.add_to_quote, data.remove_from_quote);
			}
		});


		// --- Item List management Functions --- //

		function getRaqSessCookieKey() {
			var raq_shop_key = (Shopify.shop)? Shopify.shop : '';
			return ('srils_' + raq_shop_key);
		}

		function app_bind(add_to_quote, remove_from_quote) {
			populate_raq_buttons();
			add_click_event_to_raq_btns();
			mark_unmark_all_btns_by_added_list();
			// End of MyApp Process Flow...

			// App Functions...

			function populate_raq_buttons() {
				if (request_mode == 'product') {
					scjQuery('.sc-raq-add-to-quote-btn-hldr').each(function(){
						var raq_button_holder = scjQuery(this);
						var product_id = raq_button_holder.attr('scr-pid');
						var variant_id = raq_button_holder.attr('scr-vid');
						var handle = raq_button_holder.attr('scr-handle');

						if ((product_id || variant_id) && handle) raq_button_holder.html('<button class="sc-raq-add-to-quote-btn" scr-pid="'+product_id+'" scr-vid="'+variant_id+'" scr-handle="'+handle+'">'+add_to_quote.Text+'</button>');
					});
				}
				else if (request_mode == 'cart') {
					scjQuery('.sc-raq-add-to-quote-cart-btn-hldr').each(function(){
						scjQuery(this).html('<button class="sc-raq-add-to-quote-cart-btn sc-raq-btn-design-'+add_to_quote.DesignID+'">'+add_to_quote.Text+'</button>');
					});
				}
			}

			function add_click_event_to_raq_btns() {
				scjQuery('.sc-raq-add-to-quote-btn').each(function(){
					var raq_button = scjQuery(this);
					raq_button.bind('click', function(event){
						event.preventDefault();
						event.stopPropagation();
						raq_btn_clicked(raq_button);
					});
				});

				scjQuery('.sc-raq-add-to-quote-cart-btn').each(function(){
					var raq_button = scjQuery(this);
					raq_button.bind('click', function(event){
						event.preventDefault();
						event.stopPropagation();
						raq_btn_clicked(raq_button);
					});
				});
			}

			function raq_btn_clicked(raq_button) {
				var vid = raq_button.attr('scr-vid');
				var pid = raq_button.attr('scr-pid');
				var handle = raq_button.attr('scr-handle');

				if (vid && (vid != '') && handle && (handle != '')) {
					if (raq_button.hasClass('raq-added-to-list')) {
						if (remove_item_from_list(vid, pid)) {
							add_counter_to_link();
							unmark_raq_btn_as_added(raq_button);
						}
					}
					else {
						var qty = 1;
						//raq_button.parents("form[action^=\"/cart/add\"]").find("*[name=\"quantity\"]" || "*[name=\"Quantity\"]");
						if (scjQuery("form[action='/cart/add'] #quantity").length) qty = scjQuery("form[action='/cart/add'] #quantity").val();
						if (scjQuery("form[action='/cart/add'] #Quantity").length) qty = scjQuery("form[action='/cart/add'] #Quantity").val();

						qty = parseInt(qty);
						if (isNaN(qty) || (qty < 0)) qty = 1;

						if (add_item_to_list(vid, qty, pid)) {
							add_counter_to_link();
							mark_raq_btn_as_added(raq_button);
						}
					}
				}

				if (raq_button.hasClass('sc-raq-add-to-quote-cart-btn')) {
					scjQuery(raq_cart.items).each(function(index, item){
						//if (is_sc_debug()) console.log(item);
						//if (add_item_to_list(item.variant_id, item.quantity, item.handle)) add_counter_to_link();
						//if (add_item_to_list(item.variant_id, item.quantity, item.title, item.sku, item.price, item.handle, item.image)) add_counter_to_link();
						if (add_item_to_list(item.variant_id, item.quantity, item.product_id)) add_counter_to_link();
					});

					if (is_sc_debug()) {console.log(get_added_item_list());return false;}

					//window.location = "/apps/request-a-quote/app-front/app_main/main_index_js";// Tvr: ???
					window.location = '/apps/request-a-quote/';
				}
			}

			function mark_raq_btn_as_added(raq_button) {
				if (raq_button) {
					raq_button.removeClass('sc-raq-btn-design-'+add_to_quote.DesignID);
					raq_button.addClass('sc-raq-btn-design-'+remove_from_quote.DesignID);
					if (!raq_button.hasClass('raq-added-to-list')) raq_button.addClass('raq-added-to-list');
					raq_button.text(remove_from_quote.Text);
				}
			}
			function unmark_raq_btn_as_added(raq_button) {
				if (raq_button) {
					raq_button.removeClass('raq-added-to-list');
					raq_button.removeClass('sc-raq-btn-design-'+remove_from_quote.DesignID);
					raq_button.addClass('sc-raq-btn-design-'+add_to_quote.DesignID);
					raq_button.text(add_to_quote.Text);
				}
			}
			sc_raq_app_global.unmark_raq_btn_as_added = unmark_raq_btn_as_added;

			function mark_unmark_all_btns_by_added_list() {
				// If the page is reloaded/newly_loaded, this method marks/unmarks all the RAQ buttons according to the added-items-list;
				scjQuery('.sc-raq-add-to-quote-btn').each(function(){
					var raq_button = scjQuery(this);
					var vid = raq_button.attr('scr-vid');// All 'pid' is changed to 'vid';

					if (vid && (vid != '')) {
						var item_index_on_list = item_index_on_added_item_list(vid);

						if (item_index_on_list >= 0) mark_raq_btn_as_added(raq_button);
						else unmark_raq_btn_as_added(raq_button);
					}
				});
			}
			sc_raq_app_global.mark_unmark_all_btns_by_added_list = mark_unmark_all_btns_by_added_list;

			function add_counter_to_link() {
				if (scjQuery('.sc-raq-counter').length) {
					var lists = get_added_item_list();
					var counter_txt = lists.length? (' ( '+lists.length+' )') : '';

					scjQuery('.sc-raq-counter').each(function(){
						scjQuery(this).html(counter_txt);
					});
				}
			}

			function get_added_item_list() {
				scjQuery.cookie.path = '/';
				var sc_raq_items_list = [];

				var sc_raq_items_list_str = scjQuery.cookie(raq_sess_key);

				if (sc_raq_items_list_str && (scjQuery.trim(sc_raq_items_list_str) != '')) {
					var sc_raq_items_str_arr = sc_raq_items_list_str.split('|');

					for (var i = 0; i<sc_raq_items_str_arr.length; i++) {
						var item_str = sc_raq_items_str_arr[i];
						var item = item_str.split(',');
						sc_raq_items_list.push(item);
					}
				}

				return sc_raq_items_list;
			}

			function set_added_item_list(sc_raq_items_list) {
				var sc_raq_items_list_str = '';

				for (var i=0; i<sc_raq_items_list.length; i++) {
					if (sc_raq_items_list_str != '') sc_raq_items_list_str += '|';
					sc_raq_items_list_str += sc_raq_items_list[i].join(',');
				}

				scjQuery.cookie.path = '/';
				scjQuery.cookie(raq_sess_key, sc_raq_items_list_str, {expires:1, path:'/'});

				return true;
			}

			function add_item_to_list(item_id, qty, product_id) {
				//function add_item_to_list(item_id, qty, title, sku, price, handle, image) {
				//function add_item_to_list(item_id, qty, handle) {
				var sc_raq_items_list = get_added_item_list();

				var item_index_on_list = item_index_on_added_item_list(item_id);

				//title = title.replace(/,/g, '');

				//if (item_index_on_list >= 0) sc_raq_items_list[item_index_on_list] = [item_id, qty, handle];
				//else sc_raq_items_list.push([item_id, qty, handle]);
				//if (item_index_on_list >= 0) sc_raq_items_list[item_index_on_list] = [item_id, qty, title, sku, price, handle, image];
				//else sc_raq_items_list.push([item_id, qty, title, sku, price, handle, image]);
				if (item_index_on_list >= 0) sc_raq_items_list[item_index_on_list] = [item_id, qty, product_id];
				else sc_raq_items_list.push([item_id, qty, product_id]);

				return set_added_item_list(sc_raq_items_list);
			}

			function remove_item_from_list(item_id) {
				var sc_raq_items_list = get_added_item_list();
				var new_sc_raq_items_list = [];

				// Traverse through the items, and add them into the new item_list_array if its not the removing item;
				for (var i=0; i<sc_raq_items_list.length; i++) {
					if (sc_raq_items_list[i][0] != item_id) new_sc_raq_items_list.push(sc_raq_items_list[i]);
				}

				return set_added_item_list(new_sc_raq_items_list);
			}

			function item_index_on_added_item_list(item_id) {
				var sc_raq_items_list = get_added_item_list();
				var item_index_on_list = -1;

				for (var i=0; i<sc_raq_items_list.length; i++) {
					if (sc_raq_items_list[i][0] == item_id) item_index_on_list = i;
				}

				return item_index_on_list;
			}

			function clear_added_item_list() {
				scjQuery.cookie.path = '/';
				if (scjQuery.cookie(raq_sess_key)) {
					scjQuery.cookie(raq_sess_key, '', {expires:1, path:'/'});
					scjQuery.removeCookie(raq_sess_key);
				}
			}

			add_counter_to_link();
		}
	}
})();


function raq_Update_Variant(variant, selector) {
	if (sc_raq_app_global.allow_variant == 1) {
		var select_id = selector.domIdPrefix;
		var raq_btn = $('#'+select_id).parents('form').find('.sc-raq-add-to-quote-btn');

		if (variant && (typeof variant.id != 'undefined')) {
			raq_btn.attr('scr-vid', variant.id);
			/** /if (variant.available) {
				if (raq_btn.hasClass('disabled')) raq_btn.removeClass('disabled');
			} else {
				if (!raq_btn.hasClass('disabled')) raq_btn.addClass('disabled');
			}/**/
			sc_raq_app_global.mark_unmark_all_btns_by_added_list();
		}
		else {
			raq_btn.attr('scr-vid', -1);
			//if (!raq_btn.hasClass('disabled')) raq_btn.addClass('disabled');
			sc_raq_app_global.mark_unmark_all_btns_by_added_list();
		}
	}
}

// End of File;