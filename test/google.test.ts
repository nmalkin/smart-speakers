/* eslint-disable no-useless-escape */

import {
    checkSignedOut,
    extractCsrfToken,
    parseTimestamp
} from '../src/common/google/google';

const sampleSignedOut = `<script data-id="_gd" nonce="uixwhjmrssmc5z+Rx+M177vsgqc">window.WIZ_global_data = {"DpimGf":false,"EP1ykd":["/_/*","/assistant/*","/history/privacyadvisor/*","/item","/more-activity","/myactivity","/page","/privacyadvisor","/privacyadvisor/*"],"FdrFJe":"8556083745304281846","Im6cmf":"_/FootprintsMyactivitySignedoutUi","JxkZB":{"pHJ34":"1","LtIVze":"1","k4b1Td":"1","y3VFHd":"1","Kuqpfe":"1","qSiTpe":"1","TmdDAd":"2","pbyFdc":"2","ZktbSe":"2"},"LVIXXb":1,"LoQv7e":false,"QrtxK":"","S06Grb":"","Yllh3e":"%.@.1542055183842000,174199643,2852457189]\n","cfb2h":"boq_footprintsmyactivityuiserver_20181107.03_p0","eNnkwf":"1542013000","eptZe":"/_/FootprintsMyactivitySignedoutUi/","fPDxwd":[],"fuqsbf":{},"gGcLoe":true,"nQyAE":{"tBSlob":"false"},"qwAQke":"FootprintsMyactivitySignedoutUi","qymVe":"bAkmVt80tRuoAdFBQ_RRb_Ovq6M","rtQCxc":480,"w2btAe":"%.@.null,null,\"\",false,null,null,true]\n","zChJod":"%.@.]\n"};</script>`;

const sampleCsrf = `<script nonce="SjpyVP26kbyvqIo7f0gZ">(function(){window.HISTORY_xsrf='AODP23YAAAAAW-ncZgO_7UEjo4p_pTF7UsaDAvF_4UUw';window.HISTORY_account_email='b4cheddar@gmail.com';window.HISTORY_flags=[null,null,null,null,null,false,null,null,null,null,false,null,null,null,null,null,null,null,null,null,null,false,false,null,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,false,true];window.HISTORY_locale='en';window.HISTORY_authuser=0;window.HISTORY_static_content_prefix='//www.gstatic.com/history/static/myactivity_20181106-0851_1/';window.HISTORY_version='myactivity_20181106-0851_1';window.HISTORY_gyb='Only you can see this data. Google protects your privacy and security.';window.HISTORY_is_unicorn=false;window.HISTORY_view_settings=[];window.HISTORY_one_off_settings=[];window.HISTORY_new_data_notices_config=[[[35,"0","1508515200000000"],[15,"1527231600000000","1529910000000000"],[35,"1527231600000000","1529910000000000"],[43,"1527231600000000","1529910000000000"],[44,"1527231600000000","1529910000000000"],[46,"1527231600000000","1529910000000000"],[47,"1527231600000000","1529910000000000"]]];})();</script> <script nonce="SjpyVP26kbyvqIo7f0gZ" src="//www.gstatic.com/history/static/myactivity_20181106-0851_1/angular-material.js"></script>`;

test('Test signed out regex', () => {
    expect(checkSignedOut(sampleSignedOut)).toBe(true);
});

test('Test CSRF regex', () => {
    const token = 'AODP23YAAAAAW-ncZgO_7UEjo4p_pTF7UsaDAvF_4UUw';
    expect(extractCsrfToken(sampleCsrf)).toEqual(token);
});

describe('parseTimestamp', () => {
    test('it parses the number correctly', () => {
        expect(parseTimestamp('1545740870000000')).toEqual(1545740870000);
    });

    test('returns an integer', () => {
        expect(
            Number.isInteger(parseTimestamp('1545740870300004'))
        ).toBeTruthy();
    });

    test('it throws an exception on invalid timestamp', () => {
        expect(() => {
            parseTimestamp('not a timestamp');
        }).toThrowError('not a number');
    });
});
