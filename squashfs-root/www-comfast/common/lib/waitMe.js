/* waitMe - 29.04.14 */
(function($) {
	$.fn.waitMe = function(method) {
		return this.each(function() {
		
			var elem = $(this),
			elemClass = 'waitMe',
			waitMe_text,
			effectObj,
			effectElemCount,
			createSubElem = false,
			effectElemHTML = '',
            waitMeObj,
            progressText,
            progressBarState = 0,
            progressBarStep = 1000,
            intervalId = 0,
            waitTime = 0,
			_options;
		
			var methods = {
				init : function() {
					var _defaults = {
						effect: 'bounce',
						text: '',
						bg: 'rgba(255,255,255,0.7)',
						color: '#000'
					};
					_options = $.extend(_defaults, method);

					_init();
					function _init() {
					
						waitMeObj = $('<div class="' + elemClass + '" style="background:' + _options.bg + '"></div>');
						
						switch (_options.effect) {
							case 'none':
                                effectElemCount = 0;
                                progressText = $('<div id="myProgress"><div id="myBar"></div></div>');
                            break;
                            case 'progress':
                                effectElemCount = 0;
                                break;
							case 'bounce':
								effectElemCount = 3;
							break;
							case 'rotateplane':
								effectElemCount = 1;
							break;
							case 'stretch':
								effectElemCount = 5;
							break;
							case 'orbit':
								effectElemCount = 2;
							break;
							case 'roundBounce':
								effectElemCount = 12;
							break;
							case 'win8':
								effectElemCount = 5;
								createSubElem = true;
							break;
							case 'win8_linear':
								effectElemCount = 5;
								createSubElem = true;
							break;
							case 'ios':
								effectElemCount = 12;
							break;
							case 'facebook':
								effectElemCount = 3;
							break;
						}
						
						if (effectElemCount > 0) {
							effectObj = $('<div class="' + elemClass + '_progress ' + _options.effect + '"></div>');
							for (var i = 1; i <= effectElemCount; ++i) {
								if (createSubElem) {
									effectElemHTML += '<div class="' + elemClass + '_progress_elem' + i + '"><div style="background:' + _options.color +'"></div></div>';
								} else {
									effectElemHTML += '<div class="' + elemClass + '_progress_elem' + i + '" style="background:' + _options.color +'"></div>';
								}
							}
							effectObj = $('<div class="' + elemClass + '_progress ' + _options.effect + '">' + effectElemHTML + '</div>');
						}
						
						if (_options.text) {
							waitMe_text = $('<div class="' + elemClass + '_text" style="color:' + _options.color + '">' + _options.text + '</div>');
						}
						
						if (elem.find('> .' + elemClass)) {
							elem.find('> .' + elemClass).remove();
						}
						waitMeDivObj = $('<div class="' + elemClass + '_content"></div>');
						waitMeDivObj.append(effectObj, waitMe_text);
                        waitMeObj.append(waitMeDivObj);
                        if(_options.effect == 'progress')
                        {
                            waitMeObj.append(progressText);
                            progressBarState = 0;
                            progressBarStep = waitTime / 100;
                            
                        }
    
                        if (elem[0].tagName == 'HTML') {
							elem = $('body');
						}
						elem.addClass(elemClass + '_container').append(waitMeObj);
                        elem.find('.' + elemClass + '_content').css({marginTop: - elem.find('.' + elemClass + '_content').outerHeight() / 2 + 'px'});
                        if(_options.effect == 'progress')
                        {
                            runProgress();
                        }
					}
					
				},
				hide : function() {
					waitMeClose();
				}
			};
			
			function waitMeClose() {
				elem.removeClass(elemClass + '_container');
				elem.find('.' + elemClass).remove();
            }
            
            //run every 1 sec
            function runProgress(){

                progressBarState += 10;
                var elem = document.getElementById("myBar");
                elem.style.width = progressBarState + "%";

                if(progressBarState >= 100)
                    return;

               intervalId = setTimeout(runProgress, progressBarStep);

            }
		
			if (methods[method]) {
				return methods[method].apply( this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || ! method) {
				return methods.init.apply(this, arguments);
			}
	
			$.event.special.destroyed = {
				remove: function(o) {
					if (o.handler) {
						o.handler()
					}
				}
			}
		
		});
	
	}
})(jQuery);