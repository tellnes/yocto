
;(function() {

  function getType(obj) {
    var type = Object.prototype.toString.call(obj).slice(8, -1)

    if (type.slice(0, 4) == 'HTML' && type.slice(-7) == 'Element') {
      type = 'element'
    } else {
      type = type[0].toLowerCase() + type.slice(1)
    }

    return type
  }

  function isString(obj) {
    return getType(obj) == 'string'
  }

  function isYocto(obj) {
    return obj instanceof Yocto
  }

  function unYocto(obj) {
    return isYocto(obj) ? obj._ : obj
  }

  function Yocto(element) {
    if (!element || isYocto(element)) return element
    if (!isYocto(this)) return new Yocto(element)

    if (isString(element)) element = document.getElementById(element)
    this._ = element
  }

  ; [ 'setAttribute'
    , 'focus'
    , 'blur'
  ].forEach(function(name) {
    Yocto.prototype[name] = function() {
      this._[name].apply(this._, arguments)
      return this
    }
  })

  ; [ 'hasAttribute'
    , 'getAttribute'
  ].forEach(function(name) {
    Yocto.prototype[name] = function() {
      return this._[name].apply(this._, arguments)
    }
  })


  ; [ 'cloneNode'
  ].forEach(function(name) {
    Yocto.prototype[name] = function() {
      return Yocto(this._[name].apply(this._, arguments))
    }
  })


  ; [ ['html', 'innerHTML']
    , 'className'
    , 'value'
  ].forEach(function(name) {
    var prop
    if (isString(name)) {
      prop = name
    } else {
      prop = name[1]
      name = name[0]
    }

    Yocto.prototype[name] = function(value) {
      if (!value) return this._[prop]

      this._[prop] = value
      return this
    }
  })


  ; [ 'classList'
    , 'dataSet'
    , 'nodeType'
    , 'nodeName'
    , 'style'
    , 'offsetTop'
    , 'offsetLeft'
    , 'offsetWidth'
    , 'offsetHeight'
  ].forEach(function(name) {
    Object.defineProperty(Yocto.prototype, name, {
      get: function() {
        return this._[name]
      }
    })
  })


  ; [ 'parentNode'
    , 'nextSibling'
    , 'nextElementSibling'
  ].forEach(function(name) {
    Object.defineProperty(Yocto.prototype, name, {
      get: function() {
        return Yocto(this._[name])
      }
    })
  })




  var attributesTranslation = { 'className': 'class'
                              , 'htmlFor': 'for'
                              }


  Yocto.prototype.setAttributes = function (attr) {
    var name, value
    for(name in attr) {
      if (attr.hasOwnProperty(name)) {
        value = attr[name]
        name = (attributesTranslation[name] || name)
        if (value === false || value === null) {
          this._.removeAttribute(name)
        } else if (value === true) {
          this._.setAttribute(name, name)
        } else {
          this._.setAttribute(name, value)
        }
      }
    }
    return this
  }

  Yocto.prototype.append = function(item) {
    if (arguments.length > 1) item = arguments

    if (item.length && !isString(item)) { // array or array ish
      for(var i = 0, len = item.length; i < len; i++) {
        this.append(item[i])
      }

    } else if (isYocto(item)) {
      this._.appendChild(item._)

    } else if (item.nodeType) {
      this._.appendChild(item)

    } else {
      this._.appendChild(document.createTextNode(item))
    }

    return this
  }

  Yocto.prototype.appendTo = function(element) {
    Yocto(element).append(this)
    return this
  }

  Yocto.prototype.remove = function() {
    this._.parentNode && this._.parentNode.removeChild(this._)
  }

  Yocto.prototype.on = function(type, handle) {
    this._.addEventListener(type, handle, false)
    return this
  }
  Yocto.prototype.off = function(type, handle) {
    this._.addEventListener(type, handle, false)
    return this
  }

  Yocto.prototype.equal = function(element) {
    element = unYocto(element)
    return element == this._
  }

  Yocto.prototype.show = function() {
    this._.style.display = ''
    return this
  }
  Yocto.prototype.hide = function() {
    this._.style.display = 'none'
    return this
  }

  var matchesSelector = (function() {
    var elm = document.createElement('div')
      , key = 'MatchesSelector'
      , prefixes = ['webkit', 'moz', 'o', 'ms']
      , prefix

    if (elm.matchesSelector) {
      key = 'matchesSelector'
    } else {
      while(prefixes.length) {
        prefix = prefixes.shift()
        if (elm[prefix + key]) {
          key = prefix + key
          break
        }
      }
    }

    return function (element, selector) {
      return element[key](selector)
    }
  }())

  Yocto.prototype.matchesSelector = function(selector) {
    return matchesSelector(this._, selector)
  }

  Yocto.prototype.up = function(selector) {
    if (!selector) return this.parentNode

    var element = this._

    while(!matchesSelector(element, selector)) {
      element = element.parentNode
      if (getType(element) != 'element') return null
    }

    return Yocto(element)
  }

  Yocto.prototype.insertBefore = function(element) {
    element = unYocto(element)
    element.parentNode.insertBefore(this._, element)
    return this
  }
  Yocto.prototype.insertAfter = function(element) {
    if (element.nextElementSibling) {
      this.insertBefore(element.nextElementSibling)
    } else {
      element.parentNode.appendChild(this)
    }
  }


  Yocto.prototype.setStyle = function(styles) {
    var elementStyle = this._.style
    for (var property in styles) elementStyle[property] = styles[property]
  }


  Yocto.type = getType


  Yocto.create = function(name, attr, append) {
    var element = Yocto(document.createElement(name))

    if (attr) element.setAttributes(attr)

    if (append) element.append(append)

    return element
  }


  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Yocto

  } else {
    var _yocto = window['Yocto']
      , _$ = window['$']

    window['Yocto'] = window['$'] = Yocto
    Yocto.noConflict = function(all) {
      if (all) window['Yocto'] = _yocto
      window['$'] = _$
      return Yocto
    }
  }


}())
