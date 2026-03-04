import { describe, expect, it } from 'vitest';
import { type ParseWarning, ParseError, parseDSL, serializeDSL } from './parser.js';
import { comparePrimitives } from './compare.js';
import type { Text } from './primitives/text.js';
import type { Frame } from './primitives/frame.js';
import type { BooleanOperation, Line, Polygon, Star } from './primitives/shapes.js';

describe('parseDSL', () => {
  describe('basic primitives', () => {
    it('parses a simple Frame', () => {
      const dsl = '<Frame width={100} height={200} fill="#ff0000" />';
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect(result).toMatchObject({
        type: 'frame',
        width: 100,
        height: 200,
        fill: '#ff0000',
      });
    });

    it('parses a Frame with children', () => {
      const dsl = `
        <Frame width={400} height={300}>
          <Text fontSize={24}>Hello World</Text>
        </Frame>
      `;
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).children).toHaveLength(1);
      expect((result as any).children[0].type).toBe('text');
      expect((result as any).children[0].text).toBe('Hello World');
    });

    it('parses Text with content', () => {
      const dsl = '<Text fontSize={18} fill="#000000">Some text content</Text>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('text');
      expect((result as any).text).toBe('Some text content');
      expect((result as any).fontSize).toBe(18);
    });

    it('parses Rectangle', () => {
      const dsl = '<Rectangle width={50} height={50} fill="#00ff00" cornerRadius={8} />';
      const result = parseDSL(dsl);

      expect(result.type).toBe('rectangle');
      expect(result).toMatchObject({
        width: 50,
        height: 50,
        fill: '#00ff00',
        cornerRadius: 8,
      });
    });
  });

  describe('auto-layout properties', () => {
    it('parses layoutMode and gap', () => {
      const dsl = '<Frame layoutMode="vertical" gap={24} padding={16} />';
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'frame',
        layoutMode: 'vertical',
        gap: 24,
        padding: 16,
      });
    });

    it('parses alignment properties', () => {
      const dsl = '<Frame layoutMode="horizontal" primaryAxisAlign="center" counterAxisAlign="center" />';
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'frame',
        layoutMode: 'horizontal',
        primaryAxisAlign: 'center',
        counterAxisAlign: 'center',
      });
    });
  });

  describe('sizing with fill and hug', () => {
    it('parses width="fill" on Frame', () => {
      const dsl = '<Frame width="fill" height="hug" layoutMode="vertical" />';
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'frame',
        width: 'fill',
        height: 'hug',
      });
    });

    it('parses width="fill" on Text', () => {
      const dsl = '<Text width="fill" fontSize={18}>Some text content</Text>';
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'text',
        width: 'fill',
        text: 'Some text content',
      });
    });

    it('parses mixed numeric and fill/hug values', () => {
      const dsl = '<Frame width={400} height="fill" layoutMode="vertical" />';
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'frame',
        width: 400,
        height: 'fill',
      });
    });

    it('handles horizontal layout with fill-width children', () => {
      const dsl = `
        <Frame layoutMode="horizontal" gap={24} width="fill">
          <Frame width="fill" height={100} fill="#f8fafc" />
          <Frame width="fill" height={100} fill="#f8fafc" />
        </Frame>
      `;
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'frame',
        layoutMode: 'horizontal',
        width: 'fill',
      });
      expect((result as any).children).toHaveLength(2);
      expect((result as any).children[0].width).toBe('fill');
      expect((result as any).children[1].width).toBe('fill');
    });
  });

  describe('high-level components', () => {
    it('parses Slide component', () => {
      const dsl = '<Slide><Frame width={100} height={100} /></Slide>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).width).toBe(1920);
      expect((result as any).height).toBe(1080);
      expect((result as any).children).toHaveLength(1);
    });

    it('parses SlideTitle component', () => {
      const dsl = '<SlideTitle>My Presentation</SlideTitle>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('text');
      expect((result as any).text).toBe('My Presentation');
      expect((result as any).fontSize).toBe(48);
    });

    it('parses Card component', () => {
      const dsl = '<Card width={400}><Text>Content</Text></Card>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).layoutMode).toBe('vertical');
      expect((result as any).cornerRadius).toBe(8);
    });
  });

  describe('ID preservation on high-level components', () => {
    it('preserves id on Slide component', () => {
      const dsl = '<Slide id="slide-intro"><Frame id="content" width={100} /></Slide>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).id).toBe('slide-intro');
      expect((result as any).children[0].id).toBe('content');
    });

    it('preserves id on SlideTitle component', () => {
      const dsl = '<SlideTitle id="main-title">Hello World</SlideTitle>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('text');
      expect((result as any).id).toBe('main-title');
    });

    it('preserves id on Card component', () => {
      const dsl = '<Card id="feature-card" width={400}><Text id="card-text">Content</Text></Card>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).id).toBe('feature-card');
      expect((result as any).children[0].id).toBe('card-text');
    });

    it('preserves id on Heading component', () => {
      const dsl = '<Heading id="section-heading" level={2}>Section Title</Heading>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('text');
      expect((result as any).id).toBe('section-heading');
    });

    it('preserves id on Paragraph component', () => {
      const dsl = '<Paragraph id="intro-text">Some body text here.</Paragraph>';
      const result = parseDSL(dsl);

      expect(result.type).toBe('text');
      expect((result as any).id).toBe('intro-text');
    });

    it('preserves id on StatNumber component', () => {
      const dsl = '<StatNumber id="stat-revenue" value="$10M" label="Revenue" />';
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).id).toBe('stat-revenue');
    });

    it('preserves id on BulletList component', () => {
      const dsl = '<BulletList id="features-list" items="[&quot;Fast&quot;, &quot;Easy&quot;]" />';
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).id).toBe('features-list');
    });

    it('preserves IDs in a complete slide structure', () => {
      const dsl = `
        <Slide id="slide-market">
          <Frame id="content" layoutMode="vertical" gap={48} padding={80} width={1920} height={1080}>
            <Text id="title" width="fill" fontSize={48} fontWeight={600}>Market Opportunity</Text>
            <Frame id="stats-row" layoutMode="horizontal" gap={48}>
              <Frame id="stat-tam" layoutMode="vertical" gap={8}>
                <Text id="stat-tam-value" fontSize={56} fontWeight={700} fill="#2563eb">$127B</Text>
                <Text id="stat-tam-label" fontSize={16} fill="#6b7280">TAM</Text>
              </Frame>
            </Frame>
          </Frame>
        </Slide>
      `;
      const result = parseDSL(dsl);

      expect((result as any).id).toBe('slide-market');
      
      const content = (result as any).children[0];
      expect(content.id).toBe('content');
      
      const title = content.children[0];
      expect(title.id).toBe('title');
      
      const statsRow = content.children[1];
      expect(statsRow.id).toBe('stats-row');
      
      const statTam = statsRow.children[0];
      expect(statTam.id).toBe('stat-tam');
      expect(statTam.children[0].id).toBe('stat-tam-value');
      expect(statTam.children[1].id).toBe('stat-tam-label');
    });
  });

  describe('XML comments', () => {
    it('ignores single-line comments', () => {
      const dsl = `
        <Frame width={100} height={100}>
          <!-- This is a comment -->
          <Text>Hello</Text>
        </Frame>
      `;
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).children).toHaveLength(1);
      expect((result as any).children[0].type).toBe('text');
    });

    it('ignores multi-line comments', () => {
      const dsl = `
        <Frame width={100} height={100}>
          <!-- 
            This is a multi-line comment
            with multiple lines
          -->
          <Text>Hello</Text>
        </Frame>
      `;
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).children).toHaveLength(1);
    });

    it('ignores comments between elements', () => {
      const dsl = `
        <Frame>
          <Text>First</Text>
          <!-- Comment between elements -->
          <Text>Second</Text>
        </Frame>
      `;
      const result = parseDSL(dsl);

      expect((result as any).children).toHaveLength(2);
    });

    it('ignores comment at start of document', () => {
      const dsl = `<!-- Header comment --><Frame width={100} />`;
      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
    });
  });

  describe('real-world slide with comments', () => {
    it('parses a complete slide with auto-layout and comments', () => {
      const dsl = `<Slide>
  <!-- Main content wrapper with vertical auto-layout -->
  <Frame layoutMode="vertical" gap={80} padding={80} width={1920} height={1080} primaryAxisAlign="center" counterAxisAlign="center" fill="#ffffff">
    
    <!-- Logo placeholder - centered circle -->
    <Frame width={120} height={120} fill="#2563eb" cornerRadius={60} />
    
    <!-- Company name and tagline -->
    <Frame layoutMode="vertical" gap={24} counterAxisAlign="center">
      <Text fontFamily="Inter" fontSize={64} fontWeight={700} fill="#1a1a2e" textAlignHorizontal="center">
        Your Company Name
      </Text>
      <Text fontFamily="Inter" fontSize={24} fontWeight={400} fill="#6b7280" textAlignHorizontal="center">
        One-line description of what you do
      </Text>
    </Frame>
    
    <!-- Metadata row -->
    <Frame layoutMode="vertical" gap={16} counterAxisAlign="center">
      <Text fontFamily="Inter" fontSize={18} fontWeight={400} fill="#6b7280" textAlignHorizontal="center">
        Investor Pitch Deck
      </Text>
      <Text fontFamily="Inter" fontSize={16} fontWeight={400} fill="#9ca3af" textAlignHorizontal="center">
        Confidential • January 2025
      </Text>
    </Frame>
    
  </Frame>
</Slide>`;

      const result = parseDSL(dsl);

      expect(result.type).toBe('frame');
      expect((result as any).width).toBe(1920);
      expect((result as any).height).toBe(1080);
      // Should have 1 child (the main Frame wrapper)
      expect((result as any).children).toHaveLength(1);
      
      const mainFrame = (result as any).children[0];
      expect(mainFrame.layoutMode).toBe('vertical');
      expect(mainFrame.gap).toBe(80);
      // Should have 3 children (logo, company info, metadata) - comments stripped
      expect(mainFrame.children).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('throws ParseError for empty input', () => {
      expect(() => parseDSL('')).toThrow(ParseError);
    });

    it('throws ParseError for invalid tag', () => {
      expect(() => parseDSL('<123invalid />')).toThrow(ParseError);
    });

    it('throws ParseError for unknown element type', () => {
      expect(() => parseDSL('<UnknownElement />')).toThrow(ParseError);
      expect(() => parseDSL('<UnknownElement />')).toThrow(/Valid types are/);
    });

    it('throws ParseError for mismatched closing tag', () => {
      expect(() => parseDSL('<Frame></Text>')).toThrow(ParseError);
      expect(() => parseDSL('<Frame></Text>')).toThrow(/Mismatched closing tag/);
    });

    it('provides context in error message', () => {
      try {
        parseDSL('<Frame><!invalid></Frame>');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        expect((e as ParseError).message).toContain('Context');
      }
    });
  });

  describe('primaryAxisSizing / counterAxisSizing / layoutWrap parsing', () => {
    it('parses primaryAxisSizing and counterAxisSizing on Frame', () => {
      const dsl =
        '<Frame layoutMode="vertical" primaryAxisSizing="fixed" counterAxisSizing="hug" />';
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'frame',
        layoutMode: 'vertical',
        primaryAxisSizing: 'fixed',
        counterAxisSizing: 'hug',
      });
    });

    it('parses layoutWrap on Frame', () => {
      const dsl = '<Frame layoutMode="horizontal" layoutWrap="wrap" />';
      const result = parseDSL(dsl);

      expect(result).toMatchObject({
        type: 'frame',
        layoutMode: 'horizontal',
        layoutWrap: 'wrap',
      });
    });
  });

  describe('unknown attribute warnings', () => {
    it('produces warnings for unknown attributes when warnings array is passed', () => {
      const warnings: ParseWarning[] = [];
      parseDSL(
        '<Frame width={100} height={200} primaryAxisAlignItems="center" />',
        { warnings },
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        type: 'unknown-attribute',
        element: 'Frame',
        attribute: 'primaryAxisAlignItems',
      });
    });

    it('produces no warnings for known attributes', () => {
      const warnings: ParseWarning[] = [];
      parseDSL(
        '<Frame width={100} height={200} layoutMode="vertical" primaryAxisAlign="center" />',
        { warnings },
      );

      expect(warnings).toHaveLength(0);
    });

    it('produces warnings on nested children', () => {
      const warnings: ParseWarning[] = [];
      parseDSL(
        `<Frame width={100}>
          <Text fontSize={18} bogusAttr="yes">Hello</Text>
        </Frame>`,
        { warnings },
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        element: 'Text',
        attribute: 'bogusAttr',
      });
    });

    it('produces no warnings when warnings array is not passed', () => {
      // Should not throw — warnings are simply discarded
      const result = parseDSL(
        '<Frame width={100} unknownThing="x" />',
      );
      expect(result.type).toBe('frame');
    });

    it('warns on unknown attributes for high-level components', () => {
      const warnings: ParseWarning[] = [];
      parseDSL('<Slide layoutMode="vertical" />', { warnings });

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        element: 'Slide',
        attribute: 'layoutMode',
      });
    });
  });

  describe('inline text formatting', () => {
    it('parses <B> tag', () => {
      const result = parseDSL('<Text fontSize={16}>Hello <B>world</B></Text>') as Text;

      expect(result.type).toBe('text');
      expect(result.text).toBe('Hello world');
      expect(result.segments).toHaveLength(2);
      expect(result.segments![0]).toEqual({ text: 'Hello ' });
      expect(result.segments![1]).toEqual({
        text: 'world',
        style: { fontWeight: 700 },
      });
    });

    it('parses <I> tag', () => {
      const result = parseDSL('<Text>Hello <I>world</I></Text>') as Text;

      expect(result.text).toBe('Hello world');
      expect(result.segments![1]).toEqual({
        text: 'world',
        style: { fontStyle: 'italic' },
      });
    });

    it('parses <U> tag', () => {
      const result = parseDSL('<Text>Hello <U>world</U></Text>') as Text;

      expect(result.text).toBe('Hello world');
      expect(result.segments![1]).toEqual({
        text: 'world',
        style: { textDecoration: 'underline' },
      });
    });

    it('parses <S> tag', () => {
      const result = parseDSL('<Text>Hello <S>world</S></Text>') as Text;

      expect(result.text).toBe('Hello world');
      expect(result.segments![1]).toEqual({
        text: 'world',
        style: { textDecoration: 'strikethrough' },
      });
    });

    it('parses nested <B><I> tags', () => {
      const result = parseDSL('<Text><B><I>bold italic</I></B></Text>') as Text;

      expect(result.text).toBe('bold italic');
      expect(result.segments).toHaveLength(1);
      expect(result.segments![0]).toEqual({
        text: 'bold italic',
        style: { fontWeight: 700, fontStyle: 'italic' },
      });
    });

    it('parses <Span> with attributes', () => {
      const result = parseDSL(
        '<Text>Normal <Span fontWeight={600} fill="#FF0000">custom</Span> text</Text>',
      ) as Text;

      expect(result.text).toBe('Normal custom text');
      expect(result.segments).toHaveLength(3);
      expect(result.segments![0]).toEqual({ text: 'Normal ' });
      expect(result.segments![1]).toEqual({
        text: 'custom',
        style: { fontWeight: 600, fill: '#FF0000' },
      });
      expect(result.segments![2]).toEqual({ text: ' text' });
    });

    it('preserves whitespace: A <B>B</B> C', () => {
      const result = parseDSL('<Text>A <B>B</B> C</Text>') as Text;

      expect(result.text).toBe('A B C');
      expect(result.segments).toHaveLength(3);
      expect(result.segments![0].text).toBe('A ');
      expect(result.segments![1].text).toBe('B');
      expect(result.segments![2].text).toBe(' C');
    });

    it('trims leading/trailing whitespace in inline content', () => {
      const result = parseDSL(`<Text>
        Revenue grew <B>150%</B> this year.
      </Text>`) as Text;

      expect(result.text).toBe('Revenue grew 150% this year.');
    });

    it('plain text backwards compat - no segments when no inline tags', () => {
      const result = parseDSL('<Text>Simple text</Text>') as Text;

      expect(result.text).toBe('Simple text');
      expect(result.segments).toBeUndefined();
    });

    it('handles empty inline tags gracefully', () => {
      const result = parseDSL('<Text>Hello <B></B>world</Text>') as Text;

      expect(result.text).toBe('Hello world');
      // Empty B tag produces no segment, so we get 2 segments
      expect(result.segments).toHaveLength(2);
    });

    it('handles multiple inline tags in sequence', () => {
      const result = parseDSL(
        '<Text>Was <S>$99/mo</S> — now <U>$49/mo</U>.</Text>',
      ) as Text;

      expect(result.text).toBe('Was $99/mo — now $49/mo.');
      expect(result.segments).toHaveLength(5);
      expect(result.segments![0].text).toBe('Was ');
      expect(result.segments![1]).toEqual({
        text: '$99/mo',
        style: { textDecoration: 'strikethrough' },
      });
      expect(result.segments![2].text).toBe(' — now ');
      expect(result.segments![3]).toEqual({
        text: '$49/mo',
        style: { textDecoration: 'underline' },
      });
      expect(result.segments![4].text).toBe('.');
    });

    it('works with Heading component', () => {
      const result = parseDSL(
        '<Heading>Market <B>Opportunity</B></Heading>',
      ) as Text;

      expect(result.text).toBe('Market Opportunity');
      expect(result.segments).toHaveLength(2);
      expect(result.segments![1]).toEqual({
        text: 'Opportunity',
        style: { fontWeight: 700 },
      });
    });

    it('works with Paragraph component', () => {
      const result = parseDSL(
        '<Paragraph>We grew <I>organically</I> to <B>10K users</B>.</Paragraph>',
      ) as Text;

      expect(result.text).toBe('We grew organically to 10K users.');
      expect(result.segments).toHaveLength(5);
    });

    it('serialization round-trip for inline formatting', () => {
      const input = '<Text fontSize={16}>Hello <B>world</B></Text>';
      const parsed = parseDSL(input);
      const serialized = serializeDSL(parsed);

      expect(serialized).toContain('<B>world</B>');
      // Re-parse and verify
      const reparsed = parseDSL(serialized) as Text;
      expect(reparsed.text).toBe('Hello world');
      expect(reparsed.segments).toHaveLength(2);
    });

    it('serialization round-trip for nested formatting', () => {
      const input = '<Text>Normal <B><I>bold italic</I></B> end</Text>';
      const parsed = parseDSL(input);
      const serialized = serializeDSL(parsed);

      expect(serialized).toContain('<B>');
      expect(serialized).toContain('<I>');
      const reparsed = parseDSL(serialized) as Text;
      expect(reparsed.text).toBe('Normal bold italic end');
    });
  });

  describe('new primitive types', () => {
    it('parses Line', () => {
      const dsl = '<Line width={200} height={2} stroke="#000000" strokeWeight={2} />';
      const result = parseDSL(dsl) as Line;

      expect(result.type).toBe('line');
      expect(result.width).toBe(200);
      expect(result.stroke).toBe('#000000');
      expect(result.strokeWeight).toBe(2);
    });

    it('parses Star', () => {
      const dsl = '<Star width={100} height={100} fill="#FFD700" pointCount={5} innerRadius={0.4} />';
      const result = parseDSL(dsl) as Star;

      expect(result.type).toBe('star');
      expect(result.pointCount).toBe(5);
      expect(result.innerRadius).toBe(0.4);
      expect(result.fill).toBe('#FFD700');
    });

    it('parses Polygon', () => {
      const dsl = '<Polygon width={100} height={100} fill="#00FF00" pointCount={6} />';
      const result = parseDSL(dsl) as Polygon;

      expect(result.type).toBe('polygon');
      expect(result.pointCount).toBe(6);
    });

    it('parses BooleanOperation', () => {
      const dsl = `
        <BooleanOperation operation="subtract" fill="#FF0000">
          <Rectangle width={100} height={100} fill="#0000FF" />
          <Ellipse width={60} height={60} fill="#00FF00" />
        </BooleanOperation>
      `;
      const result = parseDSL(dsl) as BooleanOperation;

      expect(result.type).toBe('boolean-operation');
      expect(result.operation).toBe('subtract');
      expect(result.children).toHaveLength(2);
      expect((result.children[0] as any).type).toBe('rectangle');
      expect((result.children[1] as any).type).toBe('ellipse');
    });

    it('serializes and re-parses Line', () => {
      const dsl = '<Line width={200} height={2} stroke="#000000" strokeWeight={2} />';
      const parsed = parseDSL(dsl);
      const serialized = serializeDSL(parsed);
      const reparsed = parseDSL(serialized) as Line;

      expect(reparsed.type).toBe('line');
      expect(reparsed.width).toBe(200);
      expect(reparsed.stroke).toBe('#000000');
    });

    it('serializes and re-parses Star', () => {
      const dsl = '<Star width={100} height={100} fill="#FFD700" pointCount={5} innerRadius={0.4} />';
      const parsed = parseDSL(dsl);
      const serialized = serializeDSL(parsed);
      const reparsed = parseDSL(serialized) as Star;

      expect(reparsed.type).toBe('star');
      expect(reparsed.pointCount).toBe(5);
      expect(reparsed.innerRadius).toBe(0.4);
    });

    it('serializes and re-parses BooleanOperation', () => {
      const dsl = `
        <BooleanOperation operation="intersect">
          <Rectangle width={100} height={100} />
          <Ellipse width={80} height={80} />
        </BooleanOperation>
      `;
      const parsed = parseDSL(dsl);
      const serialized = serializeDSL(parsed);
      const reparsed = parseDSL(serialized) as BooleanOperation;

      expect(reparsed.type).toBe('boolean-operation');
      expect(reparsed.operation).toBe('intersect');
      expect(reparsed.children).toHaveLength(2);
    });
  });

  describe('extended property parsing', () => {
    it('parses Frame with effects as JSON', () => {
      const dsl = '<Frame width={100} height={100} effects={[{"type":"drop-shadow","color":"#00000040","offset":{"x":0,"y":4},"blur":8}]} />';
      const result = parseDSL(dsl) as Frame;

      expect(result.effects).toHaveLength(1);
      expect(result.effects![0].type).toBe('drop-shadow');
    });

    it('parses Frame with constraints', () => {
      const dsl = '<Frame width={100} height={100} constraintH="stretch" constraintV="center" />';
      const result = parseDSL(dsl) as Frame;

      expect(result.constraints).toEqual({ horizontal: 'stretch', vertical: 'center' });
    });

    it('parses Frame with cornerSmoothing', () => {
      const dsl = '<Frame width={100} height={100} cornerSmoothing={0.6} />';
      const result = parseDSL(dsl) as Frame;

      expect(result.cornerSmoothing).toBe(0.6);
    });

    it('parses Frame with min/max dimensions', () => {
      const dsl = '<Frame minWidth={50} maxWidth={500} minHeight={30} maxHeight={300} />';
      const result = parseDSL(dsl) as Frame;

      expect(result.minWidth).toBe(50);
      expect(result.maxWidth).toBe(500);
      expect(result.minHeight).toBe(30);
      expect(result.maxHeight).toBe(300);
    });

    it('parses Text with lineHeight as number', () => {
      const dsl = '<Text lineHeight={24}>Hello</Text>';
      const result = parseDSL(dsl) as Text;

      expect(result.lineHeight).toBe(24);
    });

    it('parses Text with lineHeight as percentage', () => {
      const dsl = '<Text lineHeight="150%">Hello</Text>';
      const result = parseDSL(dsl) as Text;

      expect(result.lineHeight).toBe('150%');
    });

    it('parses Text with lineHeight as auto', () => {
      const dsl = '<Text lineHeight="auto">Hello</Text>';
      const result = parseDSL(dsl) as Text;

      expect(result.lineHeight).toBe('auto');
    });

    it('parses Text with letterSpacing as number', () => {
      const dsl = '<Text letterSpacing={1.5}>Hello</Text>';
      const result = parseDSL(dsl) as Text;

      expect(result.letterSpacing).toBe(1.5);
    });

    it('parses Text with letterSpacing as percentage', () => {
      const dsl = '<Text letterSpacing="5%">Hello</Text>';
      const result = parseDSL(dsl) as Text;

      expect(result.letterSpacing).toBe('5%');
    });

    it('parses Rectangle with per-corner cornerRadius', () => {
      const dsl = '<Rectangle width={100} height={100} cornerRadius={[8,16,8,16]} />';
      const result = parseDSL(dsl);

      expect((result as any).cornerRadius).toEqual([8, 16, 8, 16]);
    });

    it('parses locked and blendMode', () => {
      const dsl = '<Frame width={100} height={100} locked={true} blendMode="multiply" />';
      const result = parseDSL(dsl) as Frame;

      expect(result.locked).toBe(true);
      expect(result.blendMode).toBe('multiply');
    });

    it('parses fills as JSON array', () => {
      const dsl = '<Frame width={100} height={100} fills={[{"type":"solid","color":"#FF0000"}]} />';
      const result = parseDSL(dsl) as Frame;

      expect(result.fills).toHaveLength(1);
      expect(result.fills![0]).toEqual({ type: 'solid', color: '#FF0000' });
    });
  });

  describe('roundtrip: parse → serialize → parse', () => {
    it('roundtrips a Frame with all common properties', () => {
      const dsl = '<Frame id="test" width={400} height={300} fill="#ffffff" layoutMode="vertical" gap={24} padding={16} cornerRadius={8} opacity={0.9} rotation={45} />';
      const a = parseDSL(dsl);
      const serialized = serializeDSL(a);
      const b = parseDSL(serialized);

      const diffs = comparePrimitives(a, b);
      expect(diffs).toEqual([]);
    });

    it('roundtrips Text with segments', () => {
      const dsl = '<Text fontSize={16} fill="#333333">Hello <B>bold</B> and <I>italic</I> text</Text>';
      const a = parseDSL(dsl);
      const serialized = serializeDSL(a);
      const b = parseDSL(serialized);

      expect((b as Text).text).toBe('Hello bold and italic text');
      expect((b as Text).segments).toHaveLength(5);
      const diffs = comparePrimitives(a, b);
      expect(diffs).toEqual([]);
    });

    it('roundtrips nested frame tree', () => {
      const dsl = `
        <Frame layoutMode="vertical" gap={24} width={1920} height={1080} fill="#ffffff">
          <Frame layoutMode="horizontal" gap={16}>
            <Rectangle width={100} height={100} fill="#FF0000" cornerRadius={8} />
            <Text fontSize={24} fontWeight={700}>Title</Text>
          </Frame>
          <Text fontSize={16} fill="#666666">Description text</Text>
        </Frame>
      `;
      const a = parseDSL(dsl);
      const serialized = serializeDSL(a);
      const b = parseDSL(serialized);

      const diffs = comparePrimitives(a, b);
      expect(diffs).toEqual([]);
    });

    it('roundtrips Frame with effects and constraints', () => {
      const dsl = '<Frame width={200} height={200} effects={[{"type":"drop-shadow","color":"#00000040","offset":{"x":0,"y":4},"blur":8}]} constraintH="stretch" constraintV="center" />';
      const a = parseDSL(dsl);
      const serialized = serializeDSL(a);
      const b = parseDSL(serialized);

      const diffs = comparePrimitives(a, b);
      expect(diffs).toEqual([]);
    });

    it('roundtrips BooleanOperation with children', () => {
      const dsl = `
        <BooleanOperation operation="subtract" fill="#FF0000">
          <Rectangle width={100} height={100} />
          <Ellipse width={60} height={60} x={20} y={20} />
        </BooleanOperation>
      `;
      const a = parseDSL(dsl);
      const serialized = serializeDSL(a);
      const b = parseDSL(serialized);

      const diffs = comparePrimitives(a, b);
      expect(diffs).toEqual([]);
    });

    it('roundtrips Text with lineHeight and letterSpacing', () => {
      const dsl = '<Text fontSize={16} lineHeight="150%" letterSpacing={1.5}>Hello</Text>';
      const a = parseDSL(dsl);
      const serialized = serializeDSL(a);
      const b = parseDSL(serialized);

      const diffs = comparePrimitives(a, b);
      expect(diffs).toEqual([]);
    });
  });

  describe('comparePrimitives', () => {
    it('finds no diffs for identical primitives', () => {
      const a = parseDSL('<Frame width={100} height={200} fill="#FF0000" />');
      const b = parseDSL('<Frame width={100} height={200} fill="#FF0000" />');

      expect(comparePrimitives(a, b)).toEqual([]);
    });

    it('detects property value difference', () => {
      const a = parseDSL('<Frame width={100} height={200} />');
      const b = parseDSL('<Frame width={100} height={300} />');

      const diffs = comparePrimitives(a, b);
      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toMatchObject({ path: 'height', expected: 200, actual: 300 });
    });

    it('detects missing property', () => {
      const a = parseDSL('<Frame width={100} height={200} fill="#FF0000" />');
      const b = parseDSL('<Frame width={100} height={200} />');

      const diffs = comparePrimitives(a, b);
      expect(diffs.some((d) => d.path === 'fill')).toBe(true);
    });

    it('detects child count difference', () => {
      const a = parseDSL('<Frame><Text>A</Text></Frame>');
      const b = parseDSL('<Frame><Text>A</Text><Text>B</Text></Frame>');

      const diffs = comparePrimitives(a, b);
      expect(diffs.some((d) => d.path === 'children.length')).toBe(true);
    });
  });
});
