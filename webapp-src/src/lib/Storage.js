import Cookies from 'js-cookie';

class Storage {
  
  constructor() {
    this.storageType = false;
  }

  setStorageType(storageType) {
    if (storageType === "local") {
      var testVal = "testLocalStorage";
      try {
        localStorage.setItem(testVal, testVal);
        localStorage.removeItem(testVal);
        this.storageType = "local";
      } catch (e) {
        this.storageType = "cookie";
      }
    } else {
      this.storageType = storageType;
    }
  }
  
  setValue(key, value) {
    if (this.storageType === "local") {
      return localStorage.setItem(key, JSON.stringify(value));
    } else if (this.storageType === "cookie") {
      return Cookies.set(key, JSON.stringify(value));
    } else {
      return false;
    }
  }
  
  removeValue(key) {
    if (this.storageType === "local") {
      return localStorage.removeItem(key);
    } else if (this.storageType === "cookie") {
      return Cookies.remove(key);
    } else {
      return false;
    }
  }
  
  getValue(key) {
    var storage;
    if (this.storageType === "local") {
      storage = JSON.parse(localStorage.getItem(key));
      if (storage) {
        return storage;
      } else {
        return false;
      }
    } else if (this.storageType === "cookie") {
      try {
        storage = JSON.parse(Cookies.get(key));
        if (storage) {
          return storage;
        } else {
          return false;
        }
      } catch (err) {
        return false;
      }
    } else {
      return false;
    }
  }
}

let storage = new Storage();

export default storage;
