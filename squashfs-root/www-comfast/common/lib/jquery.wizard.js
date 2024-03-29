define(function () {
    return function (jquery) {
        (function ($) {
            var Wizard = function (element, options) {
                var kids;
                this.$element = $(element);
                this.options = $.extend({}, $.fn.wizard.defaults, options);
                this.currentStep = this.options.selectedItem.step;
                this.numSteps = this.$element.find('.steps li').length;
                this.$prevBtn = this.$element.find('button.btn-prev');
                this.$nextBtn = this.$element.find('button.btn-next');
                kids = this.$nextBtn.children().detach();
                this.nextText = $.trim(this.$nextBtn.text());
                this.$nextBtn.append(kids);
                this.$prevBtn.on('click', $.proxy(this.previous, this));
                this.$nextBtn.on('click', $.proxy(this.next, this));
                this.$element.on('click', 'li.complete', $.proxy(this.stepclicked, this));
                if (this.currentStep > 1) {
                    this.selectedItem(this.options.selectedItem);
                }
            };
            Wizard.prototype = {
                constructor: Wizard,
                setState: function () {
                    var canMovePrev = (this.currentStep > 1);
                    var firstStep = (this.currentStep === 1);
                    var lastStep = (this.currentStep === this.numSteps);
                    this.$prevBtn.attr('disabled', (firstStep === true || canMovePrev === false));
                    var data = this.$nextBtn.data();
                    if (data && data.last) {
                        this.lastText = data.last;
                        if (typeof this.lastText !== 'undefined') {
                            var text = (lastStep !== true) ? this.nextText : this.lastText;
                            var kids = this.$nextBtn.children().detach();
                            this.$nextBtn.text(text).append(kids);
                        }
                    }
                    var $steps = this.$element.find('.steps li');
                    $steps.removeClass('active').removeClass('complete');
                    $steps.find('span.badge').removeClass('badge-primary').removeClass('badge-success');
                    var prevSelector = '.steps li:lt(' + (this.currentStep - 1) + ')';
                    var $prevSteps = this.$element.find(prevSelector);
                    $prevSteps.addClass('complete');
                    $prevSteps.find('span.badge').addClass('badge-success');
                    var currentSelector = '.steps li:eq(' + (this.currentStep - 1) + ')';
                    var $currentStep = this.$element.find(currentSelector);
                    $currentStep.addClass('active');
                    $currentStep.find('span.badge').addClass('badge-primary');
                    var target = $currentStep.data().target;
                    this.$element.find('.step-pane').removeClass('active');
                    $(target).addClass('active');
                    $('.wizard .steps').attr('style', 'margin-left: 0');
                    var totalWidth = 0;
                    $('.wizard .steps > li').each(function () {
                        totalWidth += $(this).outerWidth();
                    });
                    var containerWidth = 0;
                    if ($('.wizard .actions').length) {
                        containerWidth = $('.wizard').width() - $('.wizard .actions').outerWidth();
                    } else {
                        containerWidth = $('.wizard').width();
                    }
                    if (totalWidth > containerWidth) {
                        var newMargin = totalWidth - containerWidth;
                        $('.wizard .steps').attr('style', 'margin-left: -' + newMargin + 'px');
                        if ($('.wizard li.active').position().left < 200) {
                            newMargin += $('.wizard li.active').position().left - 200;
                            if (newMargin < 1) {
                                $('.wizard .steps').attr('style', 'margin-left: 0');
                            } else {
                                $('.wizard .steps').attr('style', 'margin-left: -' + newMargin + 'px');
                            }
                        }
                    }
                    this.$element.trigger('changed');
                },
                stepclicked: function (e) {
                    var li = $(e.currentTarget);
                    var index = this.$element.find('.steps li').index(li);
                    var evt = $.Event('stepclick');
                    this.$element.trigger(evt, {
                        step: index + 1
                    });
                    if (evt.isDefaultPrevented()) return;
                    this.currentStep = (index + 1);
                    this.setState();
                },
                previous: function () {
                    var canMovePrev = (this.currentStep > 1);
                    if (canMovePrev) {
                        var e = $.Event('change');
                        this.$element.trigger(e, {
                            step: this.currentStep,
                            direction: 'previous'
                        });
                        if (e.isDefaultPrevented()) return;
                        this.currentStep -= 1;
                        this.setState();
                    }
                },
                next: function () {
                    var canMoveNext = (this.currentStep + 1 <= this.numSteps);
                    var lastStep = (this.currentStep === this.numSteps);
                    if (canMoveNext) {
                        var e = $.Event('change');
                        this.$element.trigger(e, {
                            step: this.currentStep,
                            direction: 'next'
                        });
                        if (e.isDefaultPrevented()) return;
                        this.currentStep += 1;
                        this.setState();
                    } else if (lastStep) {
                        this.$element.trigger('finished');
                    }
                },
                selectedItem: function (selectedItem) {
                    var retVal, step;
                    if (selectedItem) {
                        step = selectedItem.step || -1;
                        if (step >= 1 && step <= this.numSteps) {
                            this.currentStep = step;
                            this.setState();
                        }
                        retVal = this;
                    } else {
                        retVal = {
                            step: this.currentStep
                        };
                    }
                    return retVal;
                }
            };

            $.fn.wizard = function (option, value) {
                var methodReturn;
                var $set = this.each(function () {
                    var $this = $(this);
                    var data = $this.data('wizard');
                    var options = typeof option === 'object' && option;
                    if (!data) $this.data('wizard', (data = new Wizard(this, options)));
                    if (typeof option === 'string') methodReturn = data[option](value);
                });
                return (methodReturn === undefined) ? $set : methodReturn;
            };
            $.fn.wizard.defaults = {
                selectedItem: {
                    step: 1
                }
            };
            $.fn.wizard.Constructor = Wizard;

            $(function () {
                $('body').on('mousedown.wizard.data-api', '.wizard', function () {
                    var $this = $(this);
                    if ($this.data('wizard')) return;
                    $this.wizard($this.data());
                });
            })
        })(jQuery);
    }
});
