/**
 * BASED ON:
 * xhr-ajax.js Copyright (C) 2013 Craig Roberts (http://craig0990.co.uk)
 *
 * Licensed under the MIT License (http://mit-license.org)
 */

function ajax(options) {
    const client = new XMLHttpRequest();
    options.success = options.success || function() {};
    options.error = options.error || function() {};
    options.async = true;
    client.open(options.method || 'GET', options.url);
    client.send(options.data);
    client.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            options.success(this.responseText, this);
        } else if (this.readyState === 4) {
            options.error(this.status, this.statusText, this);
        }
    };
    return client;
}
