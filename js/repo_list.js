'use strict';

class RepoList {
    constructor(username, password, kwargs = {}) {
        this.etags = {};
        this.page_cache = {};
        this.per_page = kwargs.per_page ? kwargs.per_page : 30;
        this.params = kwargs.params ? kwargs.params : {};
        let b64_auth = btoa(username + ':' + password);
        this.http = axios.create({
            headers: {
                'Authorization': `Basic ${b64_auth}`
            },
            params: this.params,
            timeout: 1000,
        });

        this[Symbol.asyncIterator] = async function*() {
            let page_num = 1;
            let next_link = undefined;
            let parse_next_link = (header) => {
                if (header === undefined) return undefined;
                for (let link of header.split(',')) {
                    let rel = link.split(';');
                    if (rel[1] === ' rel="next"')
                        return rel[0].replace('<', '').replace('>', '');
                }
                return undefined;
            };

            do {
                let url = 'https://api.github.com/user/repos',
                    params = {},
                    headers = {};
                if (next_link !== undefined) {
                    url = next_link;
                    next_link = undefined;
                } else {
                    params.per_page = this.per_page;
                    params.page = page_num;
                }

                if (this.etags[page_num] !== undefined)
                    headers['If-None-Match'] = this.etags[page_num];

                let response;
                try {
                    response = await this.http.get(url, {
                        params: params,
                        headers: headers,
                    });
                } catch (err) {
                    console.log(err);
                    if (err.response.status === 404)
                        return [];
                    if (err.response.status === 304)
                        response = err.response;
                    else
                        throw err
                }

                if (response.status === 200) {
                    if (response.data.length === 0)
                        return [];
                    this.page_cache[page_num] = response.data;
                    this.etags[page_num] = response.headers.etag;
                    yield response.data;
                    next_link = parse_next_link(response.headers.link);
                } else if (response.status === 304) {
                    yield this.page_cache[page_num];
                }

                page_num++;
            } while (true);
        };
    }
    check_auth() {
        return this.http.get('https://api.github.com/user');
    }
}
